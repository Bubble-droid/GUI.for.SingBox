//go:build linux

package daemon

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"testing"
)

func TestReadLogTail(t *testing.T) {
	path := filepath.Join(t.TempDir(), "core.log")
	if err := os.WriteFile(path, []byte("0123456789"), 0o600); err != nil {
		t.Fatal(err)
	}

	result, err := readLogTail(path, 4, MaxLogTail)
	if err != nil {
		t.Fatal(err)
	}
	if result.Content != "6789" || !result.Truncated {
		t.Fatalf("unexpected result %+v", result)
	}

	result, err = readLogTail(path, 100, MaxLogTail)
	if err != nil {
		t.Fatal(err)
	}
	if result.Content != "0123456789" || result.Truncated {
		t.Fatalf("unexpected result %+v", result)
	}

	result, err = readLogTail(filepath.Join(t.TempDir(), "missing.log"), 10, MaxLogTail)
	if err != nil {
		t.Fatalf("missing log rejected: %v", err)
	}
	if result.Content != "" {
		t.Fatalf("unexpected missing log content %q", result.Content)
	}
}

func TestLogRotation(t *testing.T) {
	path := filepath.Join(t.TempDir(), "core.log")
	writer, err := newLogWriter(path, 64, 2)
	if err != nil {
		t.Fatal(err)
	}
	defer writer.Close()

	line := strings.Repeat("a", 40)
	for index := 0; index < 6; index++ {
		if _, err := writer.Write([]byte(line)); err != nil {
			t.Fatal(err)
		}
	}

	for _, candidate := range []string{path, path + ".1", path + ".2"} {
		if _, err := os.Stat(candidate); err != nil {
			t.Fatalf("%s missing: %v", candidate, err)
		}
	}
	if info, err := os.Stat(path); err != nil {
		t.Fatal(err)
	} else if info.Size() > 64 {
		t.Fatalf("current log exceeds rotation size: %d", info.Size())
	}
}

func TestLogConcurrentWrites(t *testing.T) {
	path := filepath.Join(t.TempDir(), "core.log")
	writer, err := newLogWriter(path, 1024, 2)
	if err != nil {
		t.Fatal(err)
	}
	defer writer.Close()

	var group sync.WaitGroup
	for worker := 0; worker < 8; worker++ {
		group.Add(1)
		go func(worker int) {
			defer group.Done()
			for line := 0; line < 50; line++ {
				if _, err := writer.Write([]byte(fmt.Sprintf("worker=%d line=%d\n", worker, line))); err != nil {
					t.Errorf("write: %v", err)
					return
				}
			}
		}(worker)
	}
	group.Wait()
}

func TestClearCoreCache(t *testing.T) {
	path := filepath.Join(t.TempDir(), "cache.db")
	if err := os.WriteFile(path, []byte("cache"), 0o600); err != nil {
		t.Fatal(err)
	}
	if err := clearCoreCache(path); err != nil {
		t.Fatal(err)
	}
	if _, err := os.Stat(path); !os.IsNotExist(err) {
		t.Fatalf("cache still exists: %v", err)
	}

	if err := os.Symlink(path, path+".link"); err != nil {
		t.Fatal(err)
	}
	if err := clearCoreCache(path + ".link"); err == nil {
		t.Fatal("expected symlink rejection")
	}
}
