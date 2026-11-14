//go:build linux

package daemon

import (
	"errors"
	"fmt"
	"io"
	"os"
	"path/filepath"
	"sync"
)

const (
	defaultLogMaxBytes = 5 << 20
	defaultLogBackups  = 2
)

// logWriter serializes core output and rotates the per-user log file.
type logWriter struct {
	path    string
	maxSize int64
	backups int

	mu   sync.Mutex
	file *os.File
	size int64
}

func newLogWriter(path string, maxSize int64, backups int) (*logWriter, error) {
	if maxSize <= 0 {
		maxSize = defaultLogMaxBytes
	}
	if backups < 0 {
		backups = 0
	}
	writer := &logWriter{path: path, maxSize: maxSize, backups: backups}
	if err := writer.open(); err != nil {
		return nil, err
	}
	return writer, nil
}

func (w *logWriter) open() error {
	file, err := os.OpenFile(w.path, os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0o600)
	if err != nil {
		return err
	}
	info, err := file.Stat()
	if err != nil {
		file.Close()
		return err
	}
	if err := file.Chmod(0o600); err != nil {
		file.Close()
		return err
	}
	w.file = file
	w.size = info.Size()
	return nil
}

func (w *logWriter) Write(data []byte) (int, error) {
	w.mu.Lock()
	defer w.mu.Unlock()

	if w.file == nil {
		return 0, io.ErrClosedPipe
	}
	if w.size > 0 && w.size+int64(len(data)) > w.maxSize {
		if err := w.rotateLocked(); err != nil {
			return 0, err
		}
	}
	n, err := w.file.Write(data)
	w.size += int64(n)
	return n, err
}

func (w *logWriter) rotateLocked() error {
	if err := w.file.Close(); err != nil {
		return err
	}
	w.file = nil

	for index := w.backups; index >= 1; index-- {
		source := w.backupPath(index)
		target := w.backupPath(index + 1)
		if index == w.backups {
			_ = os.Remove(target)
		}
		if err := os.Rename(source, target); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	}
	if w.backups > 0 {
		if err := os.Rename(w.path, w.backupPath(1)); err != nil && !errors.Is(err, os.ErrNotExist) {
			return err
		}
	} else if err := os.Remove(w.path); err != nil && !errors.Is(err, os.ErrNotExist) {
		return err
	}

	return w.open()
}

func (w *logWriter) backupPath(index int) string {
	return fmt.Sprintf("%s.%d", w.path, index)
}

func (w *logWriter) Close() error {
	w.mu.Lock()
	defer w.mu.Unlock()
	if w.file == nil {
		return nil
	}
	err := w.file.Close()
	w.file = nil
	return err
}

func readLogTail(path string, tailBytes int, maxBytes int) (ReadLogResult, error) {
	if tailBytes <= 0 {
		tailBytes = 4096
	}
	if tailBytes > maxBytes {
		tailBytes = maxBytes
	}

	file, err := os.Open(path)
	if err != nil {
		if errors.Is(err, os.ErrNotExist) {
			return ReadLogResult{}, nil
		}
		return ReadLogResult{}, err
	}
	defer file.Close()

	info, err := file.Stat()
	if err != nil {
		return ReadLogResult{}, err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return ReadLogResult{}, fmt.Errorf("log path is not a regular file")
	}

	size := info.Size()
	start := int64(0)
	truncated := false
	if size > int64(tailBytes) {
		start = size - int64(tailBytes)
		truncated = true
	}
	buffer := make([]byte, size-start)
	if len(buffer) > 0 {
		if _, err := file.ReadAt(buffer, start); err != nil && !errors.Is(err, io.EOF) {
			return ReadLogResult{}, err
		}
	}
	return ReadLogResult{Content: string(buffer), Truncated: truncated}, nil
}

func clearCoreCache(path string) error {
	info, err := os.Lstat(path)
	if errors.Is(err, os.ErrNotExist) {
		return nil
	}
	if err != nil {
		return err
	}
	if info.Mode()&os.ModeSymlink != 0 || !info.Mode().IsRegular() {
		return fmt.Errorf("cache path is not a regular file")
	}
	return os.Remove(path)
}

func ensureLogParent(path string) error {
	return os.MkdirAll(filepath.Dir(path), 0o700)
}
