//go:build linux

package daemon

import (
	"context"
	"errors"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"syscall"
	"time"
)

// coreProcess describes one running core child and its supervision state.
type coreProcess struct {
	cmd           *exec.Cmd
	pid           int
	channel       string
	ownerUID      uint32
	log           *logWriter
	done          chan struct{}
	requestedStop bool
	waitErr       error
}

func corePath(channel string, stablePath, alphaPath string) (string, error) {
	switch channel {
	case ChannelStable:
		return stablePath, nil
	case ChannelAlpha:
		return alphaPath, nil
	default:
		return "", newRPCError(CodeInvalidParams, "invalid core channel", channel)
	}
}

// coreEnvironment returns the fixed environment for core processes. The GUI
// environment is never inherited.
func coreEnvironment(stateDir, runtimeDir string) []string {
	return []string{
		"HOME=" + stateDir,
		"PATH=/usr/bin:/bin",
		"TMPDIR=" + runtimeDir,
		"XDG_CACHE_HOME=" + filepath.Join(runtimeDir, "cache"),
		"XDG_CONFIG_HOME=" + filepath.Join(runtimeDir, "config"),
		"XDG_DATA_HOME=" + filepath.Join(runtimeDir, "data"),
	}
}

// startCoreProcess forks the packaged core with fixed arguments and a fixed
// environment. It keeps root and full capabilities by design.
func startCoreProcess(corePath, configPath, workDir, stateDir, runtimeDir string, ownerUID uint32, channel string, logger *logWriter) (*coreProcess, error) {
	cmd := exec.Command(corePath, "run", "--disable-color", "-c", configPath, "-D", workDir)
	cmd.Dir = workDir
	cmd.Env = coreEnvironment(stateDir, runtimeDir)
	cmd.Stdout = logger
	cmd.Stderr = logger
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}

	if err := cmd.Start(); err != nil {
		return nil, fmt.Errorf("start core: %w", err)
	}

	process := &coreProcess{
		cmd:      cmd,
		pid:      cmd.Process.Pid,
		channel:  channel,
		ownerUID: ownerUID,
		log:      logger,
		done:     make(chan struct{}),
	}
	// Reap the child exactly once. Every waiter observes the result through
	// done, so stopping works even without a manager supervisor.
	go func() {
		process.waitErr = cmd.Wait()
		close(process.done)
	}()
	return process, nil
}

// stopCore sends SIGTERM to the whole process group and escalates to SIGKILL
// after the grace period. It does not mutate manager state.
func stopCore(process *coreProcess, grace time.Duration) error {
	if process == nil {
		return nil
	}
	process.requestedStop = true
	if err := syscall.Kill(-process.pid, syscall.SIGTERM); err != nil && err != syscall.ESRCH {
		return err
	}

	timer := time.NewTimer(grace)
	defer timer.Stop()
	select {
	case <-process.done:
		return nil
	case <-timer.C:
		if err := syscall.Kill(-process.pid, syscall.SIGKILL); err != nil && err != syscall.ESRCH {
			return err
		}
		<-process.done
		return nil
	}
}

func describeCoreExit(err error) string {
	if err == nil {
		return "core exited unexpectedly"
	}
	var exitError *exec.ExitError
	if errors.As(err, &exitError) {
		state := exitError.Sys().(syscall.WaitStatus)
		switch {
		case state.Signaled():
			return fmt.Sprintf("core terminated by signal %s", state.Signal())
		default:
			return fmt.Sprintf("core exited with status %d", state.ExitStatus())
		}
	}
	return err.Error()
}

// credentialForCaller reproduces the caller's identity for the configuration
// check. Supplementary groups are mandatory: /run/gui-for-singbox is only
// searchable by the trusted group, so a bare UID/GID drop cannot enter the
// per-request check directory.
func credentialForCaller(caller Caller) *syscall.Credential {
	return &syscall.Credential{Uid: caller.UID, Gid: caller.GID, Groups: caller.Groups}
}

// readCoreVersion asks the packaged core for its own version. The complete
// output is kept so the GUI can show environment and build tags.
// Failures are reported as an empty version instead of blocking daemon.info.
func readCoreVersion(corePath string, stateDir, runtimeDir string) string {
	if err := validateCoreBinary(corePath); err != nil {
		return ""
	}
	ctx, cancel := context.WithTimeout(context.Background(), 3*time.Second)
	defer cancel()

	cmd := exec.CommandContext(ctx, corePath, "version")
	cmd.Dir = filepath.Dir(corePath)
	cmd.Env = coreEnvironment(stateDir, runtimeDir)
	output, err := cmd.Output()
	if err != nil {
		return ""
	}
	return strings.TrimSpace(string(output))
}

func processExists(pid int) bool {
	if pid <= 0 {
		return false
	}
	err := syscall.Kill(pid, 0)
	return err == nil || err == syscall.EPERM
}

func ensureRuntimeDirectory(path string) error {
	if err := ensureDirectory(path, 0o750); err != nil {
		return err
	}
	if os.Geteuid() != 0 {
		return nil
	}
	_ = os.Chmod(path, 0o750)
	return nil
}
