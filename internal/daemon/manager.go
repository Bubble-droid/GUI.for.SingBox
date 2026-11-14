//go:build linux

package daemon

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"os"
	"os/user"
	"path/filepath"
	"strconv"
	"sync"
	"time"
)

// Core lifecycle states exposed by core.status.
const (
	StateStopped  = "stopped"
	StateStarting = "starting"
	StateRunning  = "running"
	StateStopping = "stopping"
	StateFailed   = "failed"
)

const (
	defaultStopGrace = 10 * time.Second
	defaultCheckWait = 30 * time.Second
)

// ManagerConfig contains every fixed path the daemon uses. No value comes
// from a client request.
type ManagerConfig struct {
	StateDir   string
	RuntimeDir string
	CheckRoot  string
	SocketPath string
	StableCore string
	AlphaCore  string
	LogMaxSize int64
	LogBackups int
	StopGrace  time.Duration
}

// persistedState is the only crash recovery input.
type persistedState struct {
	DesiredRunning bool   `json:"desiredRunning"`
	OwnerUID       uint32 `json:"ownerUid"`
	Channel        string `json:"channel"`
	ConfigSHA256   string `json:"configSha256"`
	LastError      string `json:"lastError"`
}

// Subscriber receives core.state events.
type Subscriber struct {
	events chan Event
}

// Events returns the receive channel for this subscriber. It is never closed;
// closing is signalled by the server connection.
func (s *Subscriber) Events() <-chan Event {
	return s.events
}

// Manager owns configuration, lifecycle and logging for all sessions. Only one
// core may run at a time.
type Manager struct {
	config ManagerConfig

	mu           sync.Mutex
	state        string
	channel      string
	pid          int
	ownerUID     uint32
	startedAt    time.Time
	lastError    string
	activeDigest string
	current      *coreProcess
	desired      persistedState
	closed       bool
	subscribers  map[*Subscriber]struct{}

	versionMu sync.Mutex
	versions  map[string]versionEntry
}

type versionEntry struct {
	value   string
	expires time.Time
}

// NewManager creates the manager and its owned directories. It does not start
// a core.
func NewManager(config ManagerConfig) (*Manager, error) {
	if config.StateDir == "" || config.RuntimeDir == "" || config.SocketPath == "" {
		return nil, errors.New("daemon paths must not be empty")
	}
	if config.StopGrace <= 0 {
		config.StopGrace = defaultStopGrace
	}
	if config.CheckRoot == "" {
		config.CheckRoot = filepath.Join(config.RuntimeDir, "checks")
	}
	if config.LogMaxSize <= 0 {
		config.LogMaxSize = defaultLogMaxBytes
	}
	if config.LogBackups < 0 {
		config.LogBackups = 0
	}

	if err := ensureDirectory(config.StateDir, 0o755); err != nil {
		return nil, fmt.Errorf("prepare state directory: %w", err)
	}
	if err := ensureDirectory(filepath.Join(config.StateDir, "users"), 0o700); err != nil {
		return nil, fmt.Errorf("prepare user state directory: %w", err)
	}
	if err := ensureDirectory(config.RuntimeDir, 0o750); err != nil {
		return nil, fmt.Errorf("prepare runtime directory: %w", err)
	}
	if err := ensureDirectory(config.CheckRoot, 0o755); err != nil {
		return nil, fmt.Errorf("prepare configuration check directory: %w", err)
	}
	for _, path := range []string{filepath.Join(config.RuntimeDir, "cache"), filepath.Join(config.RuntimeDir, "config"), filepath.Join(config.RuntimeDir, "data")} {
		if err := ensureDirectory(path, 0o700); err != nil {
			return nil, fmt.Errorf("prepare core runtime directory: %w", err)
		}
	}

	return &Manager{
		config:      config,
		state:       StateStopped,
		subscribers: make(map[*Subscriber]struct{}),
		versions:    make(map[string]versionEntry),
	}, nil
}

// Recover restores a core that was running when the daemon last stopped.
func (m *Manager) Recover(ctx context.Context) {
	state, err := m.loadPersisted()
	if err != nil {
		if !errors.Is(err, os.ErrNotExist) {
			log.Printf("daemon: read state file: %v", err)
		}
		return
	}
	if !state.DesiredRunning {
		return
	}
	if err := validateChannel(state.Channel); err != nil {
		m.markRecoveryFailed(state, err)
		return
	}
	caller, err := callerForUID(state.OwnerUID)
	if err != nil {
		log.Printf("daemon: cannot recover core for uid %d: %v", state.OwnerUID, err)
		m.markRecoveryFailed(state, err)
		return
	}
	if _, err := m.startOrSwitch(ctx, caller, state.Channel, true); err != nil {
		log.Printf("daemon: recover core for uid %d: %v", state.OwnerUID, err)
	}
}

// Status returns the current public state snapshot.
func (m *Manager) Status() CoreStatus {
	m.mu.Lock()
	defer m.mu.Unlock()
	return m.statusLocked()
}

// Info describes the daemon and its packaged core channels.
func (m *Manager) Info() CoreInfo {
	channels := []ChannelInfo{
		{Name: ChannelStable, Path: m.config.StableCore},
		{Name: ChannelAlpha, Path: m.config.AlphaCore},
	}
	for index := range channels {
		channels[index].Version = m.coreVersion(channels[index].Path)
	}
	return CoreInfo{
		Version:  Version,
		Socket:   m.config.SocketPath,
		Channels: channels,
	}
}

// Configure validates and atomically commits the caller's configuration.
// Validation runs the target core as the caller, never as root.
func (m *Manager) Configure(caller Caller, params ConfigureParams) (ConfigureResult, error) {
	if err := validateChannel(params.Channel); err != nil {
		return ConfigureResult{}, err
	}
	digest, err := validateConfigJSON(params.Config)
	if err != nil {
		return ConfigureResult{}, err
	}
	path, err := corePath(params.Channel, m.config.StableCore, m.config.AlphaCore)
	if err != nil {
		return ConfigureResult{}, err
	}
	checkCtx, cancel := configCheckContext(context.Background(), defaultCheckWait)
	defer cancel()
	if err := checkConfigWithCore(checkCtx, path, caller, params.Config, m.config.CheckRoot); err != nil {
		return ConfigureResult{}, err
	}

	dir := sessionDir(m.config.StateDir, caller.UID)
	if err := writeConfigAtomic(dir, params.Config); err != nil {
		return ConfigureResult{}, newRPCError(CodeInternal, "write configuration", err.Error())
	}
	return ConfigureResult{SHA256: digest, Bytes: len(params.Config)}, nil
}

// GetConfig returns the caller's committed configuration.
func (m *Manager) GetConfig(caller Caller) (GetConfigResult, error) {
	m.mu.Lock()
	ownedByOther := m.current != nil && m.ownerUID != caller.UID && !caller.Root
	m.mu.Unlock()
	if ownedByOther {
		return GetConfigResult{}, newRPCError(CodeUnauthorized, "core session is owned by another user", nil)
	}

	content, digest, err := readConfigFile(sessionDir(m.config.StateDir, caller.UID))
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return GetConfigResult{}, newRPCError(CodeInvalidState, "no configuration has been committed", nil)
		}
		if rpcError, ok := err.(*RPCError); ok {
			return GetConfigResult{}, rpcError
		}
		return GetConfigResult{}, newRPCError(CodeInternal, "read configuration", err.Error())
	}
	return GetConfigResult{Config: string(content), SHA256: digest}, nil
}

// ReadLog returns a bounded tail of the caller's core log.
func (m *Manager) ReadLog(caller Caller, tailBytes int) (ReadLogResult, error) {
	m.mu.Lock()
	ownedByOther := m.current != nil && m.ownerUID != caller.UID && !caller.Root
	m.mu.Unlock()
	if ownedByOther {
		return ReadLogResult{}, newRPCError(CodeUnauthorized, "core session is owned by another user", nil)
	}
	result, err := readLogTail(logPath(sessionDir(m.config.StateDir, caller.UID)), tailBytes, MaxLogTail)
	if err != nil {
		return ReadLogResult{}, newRPCError(CodeInternal, "read core log", err.Error())
	}
	return result, nil
}

// ClearCache removes the caller's cache file. It refuses while the caller's
// core is running.
func (m *Manager) ClearCache(caller Caller) error {
	m.mu.Lock()
	busy := m.current != nil && m.ownerUID == caller.UID
	m.mu.Unlock()
	if busy {
		return newRPCError(CodeBusy, "core is running", nil)
	}
	if err := clearCoreCache(cachePath(sessionDir(m.config.StateDir, caller.UID))); err != nil {
		return newRPCError(CodeInternal, "clear core cache", err.Error())
	}
	return nil
}

// Start starts the caller's core or applies a configuration change.
func (m *Manager) Start(ctx context.Context, caller Caller, channel string) (CoreStatus, error) {
	return m.startOrSwitch(ctx, caller, channel, false)
}

// Restart forces a stop and start even when the configuration is unchanged.
func (m *Manager) Restart(ctx context.Context, caller Caller, channel string) (CoreStatus, error) {
	return m.startOrSwitch(ctx, caller, channel, true)
}

// Switch stops the current core and starts the requested channel.
func (m *Manager) Switch(ctx context.Context, caller Caller, channel string) (CoreStatus, error) {
	return m.startOrSwitch(ctx, caller, channel, true)
}

// Stop gracefully stops the core. Any authenticated group member may stop it.
func (m *Manager) Stop(ctx context.Context) (CoreStatus, error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	if err := m.stopLocked(ctx); err != nil {
		return m.statusLocked(), newRPCError(CodeInternal, "stop core", err.Error())
	}
	return m.statusLocked(), nil
}

// Shutdown stops the core and clears the recovery intent.
func (m *Manager) Shutdown(ctx context.Context) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.closed = true
	m.desired.DesiredRunning = false
	if m.current != nil {
		if err := m.stopLocked(ctx); err != nil {
			log.Printf("daemon: stop core during shutdown: %v", err)
		}
	}
	m.persistLocked()
}

// Subscribe registers an event subscriber.
func (m *Manager) Subscribe() *Subscriber {
	subscriber := &Subscriber{events: make(chan Event, 32)}
	m.mu.Lock()
	if !m.closed {
		m.subscribers[subscriber] = struct{}{}
	}
	m.mu.Unlock()
	return subscriber
}

// Unsubscribe removes an event subscriber.
func (m *Manager) Unsubscribe(subscriber *Subscriber) {
	m.mu.Lock()
	delete(m.subscribers, subscriber)
	m.mu.Unlock()
}

func (m *Manager) startOrSwitch(ctx context.Context, caller Caller, channel string, force bool) (CoreStatus, error) {
	if err := validateChannel(channel); err != nil {
		return m.Status(), err
	}

	m.mu.Lock()
	defer m.mu.Unlock()

	if m.closed {
		return m.statusLocked(), newRPCError(CodeUnavailable, "daemon is shutting down", nil)
	}

	dir := sessionDir(m.config.StateDir, caller.UID)

	if m.current != nil {
		if m.ownerUID != caller.UID {
			return m.statusLocked(), newRPCError(CodeBusy, "core session is owned by another user", nil)
		}
		if m.channel == channel && !force {
			_, digest, err := readConfigFile(dir)
			if err != nil {
				return m.statusLocked(), newRPCError(CodeInvalidState, "configuration is unavailable", errorText(err))
			}
			if digest == m.activeDigest {
				return m.statusLocked(), nil
			}
		}
		if err := m.stopLocked(ctx); err != nil {
			return m.statusLocked(), newRPCError(CodeInternal, "stop core", err.Error())
		}
	}

	content, digest, err := readConfigFile(dir)
	if err != nil {
		rpcError := newRPCError(CodeInvalidState, "configuration is unavailable", errorText(err))
		m.failLocked(caller, channel, rpcError)
		return m.statusLocked(), rpcError
	}

	core, err := corePath(channel, m.config.StableCore, m.config.AlphaCore)
	if err != nil {
		return m.statusLocked(), err
	}
	if err := validateCoreBinary(core); err != nil {
		rpcError := newRPCError(CodeUnavailable, "core binary is not trusted", err.Error())
		m.failLocked(caller, channel, rpcError)
		return m.statusLocked(), rpcError
	}

	checkCtx, cancel := configCheckContext(ctx, defaultCheckWait)
	checkErr := checkConfigWithCore(checkCtx, core, caller, content, m.config.CheckRoot)
	cancel()
	if checkErr != nil {
		m.failLocked(caller, channel, checkErr)
		return m.statusLocked(), checkErr
	}

	if err := ensureDirectory(dir, 0o700); err != nil {
		rpcError := newRPCError(CodeInternal, "prepare session directory", err.Error())
		m.failLocked(caller, channel, rpcError)
		return m.statusLocked(), rpcError
	}
	logger, err := newLogWriter(logPath(dir), m.config.LogMaxSize, m.config.LogBackups)
	if err != nil {
		rpcError := newRPCError(CodeInternal, "open core log", err.Error())
		m.failLocked(caller, channel, rpcError)
		return m.statusLocked(), rpcError
	}

	process, err := startCoreProcess(core, configPath(dir), dir, m.config.StateDir, m.config.RuntimeDir, caller.UID, channel, logger)
	if err != nil {
		_ = logger.Close()
		rpcError := newRPCError(CodeInternal, "start core", err.Error())
		m.failLocked(caller, channel, rpcError)
		return m.statusLocked(), rpcError
	}

	m.current = process
	m.state = StateRunning
	m.channel = channel
	m.pid = process.pid
	m.ownerUID = caller.UID
	m.startedAt = time.Now()
	m.lastError = ""
	m.activeDigest = digest
	m.desired = persistedState{
		DesiredRunning: true,
		OwnerUID:       caller.UID,
		Channel:        channel,
		ConfigSHA256:   digest,
	}
	m.persistLocked()
	m.broadcastLocked()
	go m.supervise(process)

	return m.statusLocked(), nil
}

func (m *Manager) stopLocked(ctx context.Context) error {
	process := m.current
	if process == nil {
		if m.state == StateFailed {
			m.state = StateStopped
			m.lastError = ""
			m.persistLocked()
			m.broadcastLocked()
		}
		return nil
	}

	m.state = StateStopping
	m.pid = process.pid
	m.broadcastLocked()

	_ = ctx
	stopErr := stopCore(process, m.config.StopGrace)
	_ = process.log.Close()

	m.current = nil
	m.state = StateStopped
	m.pid = 0
	m.ownerUID = 0
	m.startedAt = time.Time{}
	m.activeDigest = ""
	m.lastError = ""
	m.desired = persistedState{
		DesiredRunning: false,
		Channel:        process.channel,
		ConfigSHA256:   "",
	}
	m.persistLocked()
	m.broadcastLocked()

	return stopErr
}

func (m *Manager) supervise(process *coreProcess) {
	<-process.done
	err := process.waitErr

	m.mu.Lock()
	defer m.mu.Unlock()

	if m.current != process {
		_ = process.log.Close()
		return
	}

	m.current = nil
	m.pid = 0
	m.ownerUID = 0
	m.startedAt = time.Time{}
	m.activeDigest = ""
	_ = process.log.Close()

	if process.requestedStop {
		m.state = StateStopped
		m.lastError = ""
	} else {
		m.state = StateFailed
		m.lastError = describeCoreExit(err)
	}
	m.desired.DesiredRunning = false
	m.desired.LastError = m.lastError
	m.persistLocked()
	m.broadcastLocked()
}

func (m *Manager) failLocked(caller Caller, channel string, err error) {
	m.state = StateFailed
	m.channel = channel
	m.ownerUID = caller.UID
	m.pid = 0
	m.startedAt = time.Time{}
	m.activeDigest = ""
	m.lastError = err.Error()
	m.desired = persistedState{
		DesiredRunning: false,
		OwnerUID:       caller.UID,
		Channel:        channel,
		LastError:      m.lastError,
	}
	m.persistLocked()
	m.broadcastLocked()
}

func (m *Manager) statusLocked() CoreStatus {
	var startedAt int64
	if !m.startedAt.IsZero() {
		startedAt = m.startedAt.Unix()
	}
	return CoreStatus{
		State:        m.state,
		Channel:      m.channel,
		Pid:          m.pid,
		OwnerUID:     m.ownerUID,
		StartedAt:    startedAt,
		LastError:    m.lastError,
		ConfigSHA256: m.activeDigest,
	}
}

func (m *Manager) broadcastLocked() {
	event := Event{Event: "core.state", Data: m.statusLocked()}
	for subscriber := range m.subscribers {
		select {
		case subscriber.events <- event:
		default:
		}
	}
}

func (m *Manager) persistLocked() {
	state := m.desired
	if state.Channel == "" {
		state.Channel = m.channel
	}
	if state.OwnerUID == 0 && m.ownerUID != 0 {
		state.OwnerUID = m.ownerUID
	}
	if state.LastError == "" {
		state.LastError = m.lastError
	}
	if err := writeStateFile(statePath(m.config.StateDir), state); err != nil {
		log.Printf("daemon: write state file: %v", err)
	}
}

func (m *Manager) loadPersisted() (persistedState, error) {
	return readStateFile(statePath(m.config.StateDir))
}

func (m *Manager) markRecoveryFailed(state persistedState, err error) {
	m.mu.Lock()
	defer m.mu.Unlock()
	m.state = StateFailed
	m.channel = state.Channel
	m.ownerUID = state.OwnerUID
	m.lastError = err.Error()
	m.desired.DesiredRunning = false
	m.desired.LastError = m.lastError
	m.persistLocked()
}

func (m *Manager) coreVersion(path string) string {
	m.versionMu.Lock()
	entry, ok := m.versions[path]
	m.versionMu.Unlock()
	if ok && time.Now().Before(entry.expires) {
		return entry.value
	}
	value := readCoreVersion(path, m.config.StateDir, m.config.RuntimeDir)
	m.versionMu.Lock()
	m.versions[path] = versionEntry{value: value, expires: time.Now().Add(30 * time.Second)}
	m.versionMu.Unlock()
	return value
}

func callerForUID(uid uint32) (Caller, error) {
	account, err := user.LookupId(strconv.FormatUint(uint64(uid), 10))
	if err != nil {
		return Caller{}, fmt.Errorf("look up uid %d: %w", uid, err)
	}
	gid, err := strconv.ParseUint(account.Gid, 10, 32)
	if err != nil {
		return Caller{}, fmt.Errorf("parse gid for uid %d: %w", uid, err)
	}
	var groups []uint32
	if ids, err := account.GroupIds(); err == nil {
		for _, id := range ids {
			value, err := strconv.ParseUint(id, 10, 32)
			if err != nil {
				continue
			}
			groups = append(groups, uint32(value))
		}
	}
	return Caller{UID: uid, GID: uint32(gid), Groups: groups, Root: uid == 0}, nil
}

func errorText(err error) string {
	if err == nil {
		return ""
	}
	return err.Error()
}

func writeStateFile(path string, state persistedState) error {
	content, err := json.Marshal(state)
	if err != nil {
		return err
	}
	return writeFileAtomic(path, content, 0o600)
}

func readStateFile(path string) (persistedState, error) {
	content, err := os.ReadFile(path)
	if err != nil {
		return persistedState{}, err
	}
	var state persistedState
	if err := json.Unmarshal(content, &state); err != nil {
		return persistedState{}, err
	}
	return state, nil
}

// writeFileAtomic writes a root-owned file next to its target and renames it.
func writeFileAtomic(path string, content []byte, mode os.FileMode) error {
	dir := filepath.Dir(path)
	temp, err := os.CreateTemp(dir, ".state-*.tmp")
	if err != nil {
		return err
	}
	tempName := temp.Name()
	cleanup := func() {
		_ = temp.Close()
		_ = os.Remove(tempName)
	}
	if err := temp.Chmod(mode); err != nil {
		cleanup()
		return err
	}
	if _, err := temp.Write(content); err != nil {
		cleanup()
		return err
	}
	if err := temp.Sync(); err != nil {
		cleanup()
		return err
	}
	if err := temp.Close(); err != nil {
		_ = os.Remove(tempName)
		return err
	}
	if err := os.Rename(tempName, path); err != nil {
		_ = os.Remove(tempName)
		return err
	}
	dirFile, err := os.Open(dir)
	if err != nil {
		return err
	}
	defer dirFile.Close()
	return dirFile.Sync()
}
