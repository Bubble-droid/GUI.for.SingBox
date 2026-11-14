//go:build linux

package daemon

import (
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"os/exec"
	"path/filepath"
	"sync"
	"syscall"
	"time"
	"unicode/utf8"

	"golang.org/x/sys/unix"
)

// validateConfigJSON enforces the daemon's configuration contract: a bounded,
// valid UTF-8 JSON object. The daemon never parses configuration semantics.
func validateConfigJSON(config []byte) (string, error) {
	if len(config) == 0 {
		return "", newRPCError(CodeConfigInvalid, "configuration is empty", nil)
	}
	if len(config) > MaxConfigSize {
		return "", newRPCError(CodeConfigInvalid, "configuration is too large", len(config))
	}
	if !utf8.Valid(config) {
		return "", newRPCError(CodeConfigInvalid, "configuration is not valid UTF-8", nil)
	}
	if !json.Valid(config) {
		return "", newRPCError(CodeConfigInvalid, "configuration is not valid JSON", nil)
	}
	var object map[string]json.RawMessage
	if err := json.Unmarshal(config, &object); err != nil {
		return "", newRPCError(CodeConfigInvalid, "configuration must be a JSON object", err.Error())
	}
	if object == nil {
		return "", newRPCError(CodeConfigInvalid, "configuration must be a JSON object", nil)
	}
	digest := sha256.Sum256(config)
	return hex.EncodeToString(digest[:]), nil
}

func writeConfigAtomic(dir string, config []byte) error {
	if err := ensureDirectory(dir, 0o700); err != nil {
		return err
	}
	target := configPath(dir)
	if info, err := os.Lstat(target); err == nil {
		if info.Mode()&os.ModeSymlink != 0 {
			return fmt.Errorf("configuration path is a symbolic link")
		}
		if !info.Mode().IsRegular() {
			return fmt.Errorf("configuration path is not a regular file")
		}
	} else if !errors.Is(err, os.ErrNotExist) {
		return err
	}

	temp, err := os.CreateTemp(dir, ".config-*.tmp")
	if err != nil {
		return err
	}
	tempName := temp.Name()
	cleanup := func() {
		_ = temp.Close()
		_ = os.Remove(tempName)
	}
	if err := temp.Chmod(0o600); err != nil {
		cleanup()
		return err
	}
	if _, err := temp.Write(config); err != nil {
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
	if err := os.Rename(tempName, target); err != nil {
		_ = os.Remove(tempName)
		return err
	}
	if err := os.Chmod(target, 0o600); err != nil {
		return err
	}
	dirFile, err := os.Open(dir)
	if err != nil {
		return err
	}
	defer dirFile.Close()
	return dirFile.Sync()
}

func readConfigFile(dir string) ([]byte, string, error) {
	path := configPath(dir)
	file, err := os.Open(path)
	if err != nil {
		return nil, "", err
	}
	defer file.Close()
	info, err := file.Stat()
	if err != nil {
		return nil, "", err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return nil, "", fmt.Errorf("configuration path is not a regular file")
	}
	if info.Size() > MaxConfigSize {
		return nil, "", fmt.Errorf("configuration is too large")
	}
	content, err := io.ReadAll(io.LimitReader(file, MaxConfigSize+1))
	if err != nil {
		return nil, "", err
	}
	digest, err := validateConfigJSON(content)
	if err != nil {
		return nil, "", err
	}
	return content, digest, nil
}

type limitedWriter struct {
	mu    sync.Mutex
	limit int
	data  []byte
}

func (w *limitedWriter) Write(data []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()
	remaining := w.limit - len(w.data)
	if remaining > 0 {
		if len(data) > remaining {
			w.data = append(w.data, data[:remaining]...)
		} else {
			w.data = append(w.data, data...)
		}
	}
	return len(data), nil
}

func (w *limitedWriter) String() string {
	w.mu.Lock()
	defer w.mu.Unlock()
	return string(w.data)
}

// checkConfigWithCore runs the packaged core's own parser as the requesting
// user. The configuration is passed through an anonymous file descriptor, so
// no client-controlled path is ever opened.
func checkConfigWithCore(ctx context.Context, corePath string, caller Caller, config []byte, checkRoot string) error {
	if err := validateCoreBinary(corePath); err != nil {
		return newRPCError(CodeUnavailable, "core binary is not trusted", err.Error())
	}

	workDir, err := os.MkdirTemp(checkRoot, "check-")
	if err != nil {
		return newRPCError(CodeInternal, "create configuration check directory", err.Error())
	}
	defer os.RemoveAll(workDir)
	if err := os.Chmod(workDir, 0o700); err != nil {
		return newRPCError(CodeInternal, "secure configuration check directory", err.Error())
	}
	if os.Geteuid() == 0 {
		if err := os.Chown(workDir, int(caller.UID), int(caller.GID)); err != nil {
			return newRPCError(CodeInternal, "set configuration check directory owner", err.Error())
		}
	}

	configFile, cleanup, err := anonymousConfigFile(config)
	if err != nil {
		return newRPCError(CodeInternal, "create anonymous configuration", err.Error())
	}
	defer cleanup()

	cmd := exec.Command(corePath, "check", "--disable-color", "-c", "/proc/self/fd/3")
	cmd.Dir = workDir
	cmd.Env = []string{
		"HOME=" + workDir,
		"TMPDIR=" + workDir,
		"XDG_CACHE_HOME=" + filepath.Join(workDir, "cache"),
		"XDG_CONFIG_HOME=" + filepath.Join(workDir, "config"),
		"XDG_DATA_HOME=" + filepath.Join(workDir, "data"),
		"PATH=/usr/bin:/bin",
	}
	cmd.ExtraFiles = []*os.File{configFile}
	cmd.SysProcAttr = &syscall.SysProcAttr{Setpgid: true}
	if os.Geteuid() == 0 {
		cmd.SysProcAttr.Credential = credentialForCaller(caller)
	}

	output := &limitedWriter{limit: 64 << 10}
	cmd.Stdout = output
	cmd.Stderr = output

	if err := cmd.Start(); err != nil {
		return newRPCError(CodeUnavailable, "start core configuration check", err.Error())
	}
	done := make(chan error, 1)
	go func() {
		done <- cmd.Wait()
	}()

	select {
	case err := <-done:
		if err != nil {
			detail := output.String()
			if detail == "" {
				detail = err.Error()
			}
			return newRPCError(CodeConfigInvalid, "core rejected the configuration", detail)
		}
		return nil
	case <-ctx.Done():
		_ = syscall.Kill(-cmd.Process.Pid, syscall.SIGKILL)
		<-done
		return newRPCError(CodeInvalidState, "configuration check timed out", nil)
	}
}

func anonymousConfigFile(config []byte) (*os.File, func(), error) {
	fd, err := unix.MemfdCreate("gui-for-singbox-config", unix.MFD_CLOEXEC)
	if err == nil {
		file := os.NewFile(uintptr(fd), "config.json")
		if file == nil {
			_ = unix.Close(fd)
			return nil, nil, fmt.Errorf("create memfd file")
		}
		if _, err := file.Write(config); err != nil {
			file.Close()
			return nil, nil, err
		}
		if _, err := file.Seek(0, io.SeekStart); err != nil {
			file.Close()
			return nil, nil, err
		}
		return file, func() { _ = file.Close() }, nil
	}

	reader, writer, err := os.Pipe()
	if err != nil {
		return nil, nil, err
	}
	go func() {
		_, _ = writer.Write(config)
		_ = writer.Close()
	}()
	return reader, func() { _ = reader.Close() }, nil
}

func configCheckContext(parent context.Context, timeout time.Duration) (context.Context, context.CancelFunc) {
	if timeout <= 0 {
		timeout = 30 * time.Second
	}
	return context.WithTimeout(parent, timeout)
}
