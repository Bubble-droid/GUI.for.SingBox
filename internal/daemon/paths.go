//go:build linux

package daemon

import (
	"errors"
	"fmt"
	"os"
	"path/filepath"
	"strconv"
	"syscall"

	"golang.org/x/sys/unix"
)

const (
	DefaultSocketPath = "/run/gui-for-singbox/daemon.sock"
	DefaultStateDir   = "/var/lib/gui-for-singbox"
	DefaultRuntimeDir = "/run/gui-for-singbox"
	DefaultGroup      = "gui-for-singbox"
	DefaultStableCore = "/usr/lib/gui-for-singbox/cores/sing-box"
	DefaultAlphaCore  = "/usr/lib/gui-for-singbox/cores/sing-box-alpha"
)

func validateChannel(channel string) error {
	switch channel {
	case ChannelStable, ChannelAlpha:
		return nil
	default:
		return newRPCError(CodeInvalidParams, "invalid core channel", channel)
	}
}

func sessionDir(stateDir string, uid uint32) string {
	return filepath.Join(stateDir, "users", strconv.FormatUint(uint64(uid), 10))
}

func configPath(dir string) string {
	return filepath.Join(dir, "config.json")
}

func logPath(dir string) string {
	return filepath.Join(dir, "core.log")
}

func cachePath(dir string) string {
	return filepath.Join(dir, "cache.db")
}

func statePath(stateDir string) string {
	return filepath.Join(stateDir, "state.json")
}

// ensureDirectory creates path and verifies it is a real directory owned by
// root. The daemon never accepts a client supplied directory here.
func ensureDirectory(path string, mode os.FileMode) error {
	info, err := os.Lstat(path)
	switch {
	case err == nil:
		if info.Mode()&os.ModeSymlink != 0 || !info.IsDir() {
			return fmt.Errorf("%s is not a directory", path)
		}
		if os.Geteuid() == 0 {
			if stat, ok := info.Sys().(*syscall.Stat_t); ok && stat.Uid != 0 {
				return fmt.Errorf("%s is not owned by root", path)
			}
		}
		if info.Mode().Perm() != mode {
			if err := os.Chmod(path, mode); err != nil {
				return err
			}
		}
		return nil
	case errors.Is(err, os.ErrNotExist):
		if err := os.MkdirAll(path, mode); err != nil {
			return err
		}
		if err := os.Chmod(path, mode); err != nil {
			return err
		}
		return nil
	default:
		return err
	}
}

// validateCoreBinary rejects any binary that could grant privileges to a
// normal user. Core permissions must come only from the root daemon.
func validateCoreBinary(path string) error {
	info, err := os.Lstat(path)
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 {
		return fmt.Errorf("%s is a symbolic link", path)
	}
	if !info.Mode().IsRegular() {
		return fmt.Errorf("%s is not a regular file", path)
	}
	if os.Geteuid() == 0 {
		stat, ok := info.Sys().(*syscall.Stat_t)
		if !ok || stat.Uid != 0 {
			return fmt.Errorf("%s is not owned by root", path)
		}
	}
	if info.Mode().Perm()&0o022 != 0 {
		return fmt.Errorf("%s is writable by group or others", path)
	}
	if info.Mode()&(os.ModeSetuid|os.ModeSetgid) != 0 {
		return fmt.Errorf("%s has setuid or setgid bits", path)
	}

	size, err := unix.Getxattr(path, "security.capability", nil)
	if err == nil && size > 0 {
		return fmt.Errorf("%s has file capabilities", path)
	}
	if err != nil && !errors.Is(err, unix.ENODATA) && !errors.Is(err, unix.ENOTSUP) {
		return fmt.Errorf("inspect %s capabilities: %w", path, err)
	}

	return nil
}
