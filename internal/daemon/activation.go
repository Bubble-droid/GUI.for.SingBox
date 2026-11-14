//go:build linux

package daemon

import (
	"errors"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"strconv"
)

// systemdListener returns the socket inherited through socket activation.
func systemdListener() (net.Listener, bool, error) {
	fdsValue := os.Getenv("LISTEN_FDS")
	if fdsValue == "" {
		return nil, false, nil
	}
	pidValue := os.Getenv("LISTEN_PID")
	if pidValue != "" {
		pid, err := strconv.Atoi(pidValue)
		if err != nil || pid != os.Getpid() {
			return nil, false, nil
		}
	}
	count, err := strconv.Atoi(fdsValue)
	if err != nil || count < 1 {
		return nil, false, fmt.Errorf("invalid LISTEN_FDS value %q", fdsValue)
	}

	file := os.NewFile(uintptr(3), "systemd-listen-fd")
	if file == nil {
		return nil, true, errors.New("inherited socket descriptor is unavailable")
	}
	listener, err := net.FileListener(file)
	_ = file.Close()
	if err != nil {
		return nil, true, fmt.Errorf("use inherited socket: %w", err)
	}
	if _, ok := listener.(*net.UnixListener); !ok {
		_ = listener.Close()
		return nil, true, errors.New("inherited socket is not a Unix domain socket")
	}
	return listener, true, nil
}

// ListenSocket either adopts the socket activation listener or binds the
// fixed socket path for development and tests.
func ListenSocket(socketPath, runtimeDir string, groupGID uint32) (net.Listener, bool, error) {
	if err := prepareRuntimeDirectory(runtimeDir, groupGID); err != nil {
		return nil, false, err
	}
	if listener, activated, err := systemdListener(); activated || err != nil {
		return listener, activated, err
	}

	switch info, err := os.Lstat(socketPath); {
	case err == nil:
		if info.Mode()&os.ModeSymlink != 0 {
			return nil, false, fmt.Errorf("%s is a symbolic link", socketPath)
		}
		if info.Mode()&os.ModeSocket == 0 {
			return nil, false, fmt.Errorf("%s is not a socket", socketPath)
		}
		if err := os.Remove(socketPath); err != nil {
			return nil, false, fmt.Errorf("remove stale socket: %w", err)
		}
	case errors.Is(err, os.ErrNotExist):
	default:
		return nil, false, err
	}

	listener, err := net.ListenUnix("unix", &net.UnixAddr{Name: socketPath, Net: "unix"})
	if err != nil {
		return nil, false, err
	}
	listener.SetUnlinkOnClose(true)

	if os.Geteuid() == 0 {
		if err := os.Chown(socketPath, 0, int(groupGID)); err != nil {
			_ = listener.Close()
			return nil, false, err
		}
	}
	if err := os.Chmod(socketPath, 0o660); err != nil {
		_ = listener.Close()
		return nil, false, err
	}
	return listener, false, nil
}

func prepareRuntimeDirectory(runtimeDir string, groupGID uint32) error {
	if err := ensureDirectory(runtimeDir, 0o750); err != nil {
		return fmt.Errorf("prepare runtime directory: %w", err)
	}
	if os.Geteuid() == 0 {
		if err := os.Chown(runtimeDir, 0, int(groupGID)); err != nil {
			return err
		}
	}
	return os.Chmod(runtimeDir, 0o750)
}

// socketPathFromRuntime returns the fixed socket path for a runtime directory.
func socketPathFromRuntime(runtimeDir string) string {
	return filepath.Join(runtimeDir, "daemon.sock")
}
