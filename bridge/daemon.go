package bridge

import (
	"encoding/json"
	"errors"
	"log"
	"sync"

	"github.com/wailsapp/wails/v2/pkg/runtime"
)

const (
	// daemonSocketPath is the fixed system-package daemon endpoint.
	daemonSocketPath = "/run/gui-for-singbox/daemon.sock"
	// daemonStateEvent is emitted on the Wails event bus for core state changes.
	daemonStateEvent = "daemonCoreState"
)

// JSON-RPC error codes mirrored from internal/daemon.
const (
	daemonCodeUnavailable = -32002
	daemonCodeInternal    = -32007
)

// DaemonError is the protocol error returned by the daemon.
type DaemonError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func (e *DaemonError) Error() string {
	if e == nil {
		return ""
	}
	if e.Data == nil {
		return e.Message
	}
	return e.Message + ": " + stringifyDaemonData(e.Data)
}

func stringifyDaemonData(data any) string {
	if text, ok := data.(string); ok {
		return text
	}
	content, err := json.Marshal(data)
	if err != nil {
		return ""
	}
	return string(content)
}

// DaemonInfo describes the daemon and its packaged core channels.
type DaemonInfo struct {
	Version  string          `json:"version"`
	Socket   string          `json:"socket"`
	Channels []DaemonChannel `json:"channels"`
}

// DaemonChannel describes one packaged core binary.
type DaemonChannel struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Version string `json:"version"`
}

// DaemonCoreStatus is the public core lifecycle snapshot.
type DaemonCoreStatus struct {
	State        string `json:"state"`
	Channel      string `json:"channel"`
	Pid          int    `json:"pid"`
	OwnerUID     uint32 `json:"ownerUid"`
	StartedAt    int64  `json:"startedAt"`
	LastError    string `json:"lastError"`
	ConfigSHA256 string `json:"configSha256"`
}

// DaemonConfigureResult reports the committed configuration digest.
type DaemonConfigureResult struct {
	SHA256 string `json:"sha256"`
	Bytes  int    `json:"bytes"`
}

// DaemonConfig is the committed configuration returned to its owner.
type DaemonConfig struct {
	Config string `json:"config"`
	SHA256 string `json:"sha256"`
}

// DaemonLog is a bounded tail of the owner's core log.
type DaemonLog struct {
	Content   string `json:"content"`
	Truncated bool   `json:"truncated"`
}

// daemonResult encodes a successful result as a FlagResult.
func daemonResult(value any) FlagResult {
	content, err := json.Marshal(value)
	if err != nil {
		return FlagResult{false, err.Error()}
	}
	return FlagResult{true, string(content)}
}

// daemonFailure encodes a failure as a FlagResult carrying structured JSON.
func daemonFailure(err error) FlagResult {
	if err == nil {
		return FlagResult{false, "daemon request failed"}
	}
	rpcError := &DaemonError{Code: daemonCodeInternal, Message: err.Error()}
	var typed *DaemonError
	if errors.As(err, &typed) {
		rpcError = typed
	}
	content, marshalErr := json.Marshal(rpcError)
	if marshalErr != nil {
		return FlagResult{false, err.Error()}
	}
	log.Printf("daemon: %v", err)
	return FlagResult{false, string(content)}
}

// daemonCall performs one request and unmarshals its result into target.
func daemonCall(method string, params any, target any) FlagResult {
	if err := daemonRequest(method, params, target); err != nil {
		return daemonFailure(err)
	}
	return daemonResult(target)
}

// DaemonInfo reports the daemon version and packaged core channels.
func (a *App) DaemonInfo() FlagResult {
	var info DaemonInfo
	return daemonCall("daemon.info", nil, &info)
}

// DaemonStatus reports the current core lifecycle state.
func (a *App) DaemonStatus() FlagResult {
	var status DaemonCoreStatus
	return daemonCall("core.status", nil, &status)
}

// DaemonApplyConfig validates and atomically commits a configuration.
func (a *App) DaemonApplyConfig(channel string, config string) FlagResult {
	var result DaemonConfigureResult
	return daemonCall("core.configure", map[string]any{
		"channel": channel,
		"config":  json.RawMessage(config),
	}, &result)
}

// DaemonGetConfig returns the caller's committed configuration.
func (a *App) DaemonGetConfig() FlagResult {
	var config DaemonConfig
	return daemonCall("core.getConfig", nil, &config)
}

// DaemonStart starts the caller's core on the requested channel.
func (a *App) DaemonStart(channel string) FlagResult {
	var status DaemonCoreStatus
	return daemonCall("core.start", map[string]any{"channel": channel}, &status)
}

// DaemonStop gracefully stops the running core.
func (a *App) DaemonStop() FlagResult {
	var status DaemonCoreStatus
	return daemonCall("core.stop", nil, &status)
}

// DaemonRestart stops and starts the running core.
func (a *App) DaemonRestart(channel string) FlagResult {
	var status DaemonCoreStatus
	return daemonCall("core.restart", map[string]any{"channel": channel}, &status)
}

// DaemonSwitch switches the running core between stable and alpha.
func (a *App) DaemonSwitch(channel string) FlagResult {
	var status DaemonCoreStatus
	return daemonCall("core.switch", map[string]any{"channel": channel}, &status)
}

// DaemonReadLog returns a bounded tail of the caller's core log.
func (a *App) DaemonReadLog(tailBytes int) FlagResult {
	var result DaemonLog
	return daemonCall("core.readLog", map[string]any{"tailBytes": tailBytes}, &result)
}

// DaemonClearCache removes the caller's core cache while the core is stopped.
func (a *App) DaemonClearCache() FlagResult {
	var result struct{}
	return daemonCall("core.clearCache", nil, &result)
}

var daemonWatchOnce sync.Once

// DaemonWatch subscribes to core state events once and forwards them to the
// frontend. Reconnection is handled inside the subscription loop.
func (a *App) DaemonWatch() FlagResult {
	if Env.OS != "linux" || !Env.IsSystemPackage {
		return FlagResult{false, "daemon core mode is unavailable"}
	}
	daemonWatchOnce.Do(func() {
		go daemonWatchLoop(a, func(status DaemonCoreStatus) {
			runtime.EventsEmit(a.Ctx, daemonStateEvent, status)
		})
	})
	return FlagResult{true, "Success"}
}
