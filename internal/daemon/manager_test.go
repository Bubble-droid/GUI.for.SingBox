//go:build linux

package daemon

import (
	"context"
	"os"
	"path/filepath"
	"strings"
	"testing"
)

func writeFakeCore(t *testing.T) string {
	t.Helper()
	path := filepath.Join(t.TempDir(), "fake-sing-box")
	script := `#!/bin/sh
case "$1" in
check)
	if grep -q '"reject"' /proc/self/fd/3 2>/dev/null; then
		echo "fake core rejected configuration" >&2
		exit 1
	fi
	exit 0
	;;
version)
	echo "fake-sing-box 1.0.0"
	exit 0
	;;
run)
	trap 'exit 0' TERM INT
	while :; do sleep 0.05; done
	;;
esac
exit 0
`
	if err := os.WriteFile(path, []byte(script), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(path, 0o700); err != nil {
		t.Fatal(err)
	}
	return path
}

func newTestManager(t *testing.T) (*Manager, string) {
	t.Helper()
	root := t.TempDir()
	core := writeFakeCore(t)
	manager, err := NewManager(ManagerConfig{
		StateDir:   filepath.Join(root, "state"),
		RuntimeDir: filepath.Join(root, "run"),
		CheckRoot:  filepath.Join(root, "checks"),
		SocketPath: filepath.Join(root, "run", "daemon.sock"),
		StableCore: core,
		AlphaCore:  core,
	})
	if err != nil {
		t.Fatal(err)
	}
	return manager, root
}

func testCaller() Caller {
	return Caller{UID: uint32(os.Getuid()), GID: uint32(os.Getgid())}
}

func TestConfigureAndGetConfig(t *testing.T) {
	manager, _ := newTestManager(t)
	caller := testCaller()

	result, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(`{"log":{"level":"info"}}`)})
	if err != nil {
		t.Fatalf("configure: %v", err)
	}
	if result.SHA256 == "" || result.Bytes == 0 {
		t.Fatalf("unexpected configure result %+v", result)
	}

	config, err := manager.GetConfig(caller)
	if err != nil {
		t.Fatalf("get config: %v", err)
	}
	if config.SHA256 != result.SHA256 {
		t.Fatalf("digest mismatch: %q != %q", config.SHA256, result.SHA256)
	}
	if !strings.Contains(config.Config, "log") {
		t.Fatalf("unexpected config %q", config.Config)
	}
}

func TestConfigureRejectsInvalidConfig(t *testing.T) {
	manager, _ := newTestManager(t)
	caller := testCaller()

	for _, config := range []string{"", "[]", "null", "{"} {
		if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(config)}); err == nil {
			t.Fatalf("expected rejection for %q", config)
		}
	}
}

func TestConfigureFailureKeepsOldConfig(t *testing.T) {
	manager, _ := newTestManager(t)
	caller := testCaller()

	if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(`{"value":"ok"}`)}); err != nil {
		t.Fatal(err)
	}
	before, err := manager.GetConfig(caller)
	if err != nil {
		t.Fatal(err)
	}

	if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(`{"value":"reject"}`)}); err == nil {
		t.Fatal("expected validation failure")
	}

	after, err := manager.GetConfig(caller)
	if err != nil {
		t.Fatal(err)
	}
	if before.SHA256 != after.SHA256 || before.Config != after.Config {
		t.Fatal("failed validation changed the committed configuration")
	}
}

func TestStartStopAndIdempotence(t *testing.T) {
	manager, _ := newTestManager(t)
	caller := testCaller()
	if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(`{"log":{}}`)}); err != nil {
		t.Fatal(err)
	}

	status, err := manager.Start(context.Background(), caller, ChannelStable)
	if err != nil {
		t.Fatalf("start: %v", err)
	}
	if status.State != StateRunning || status.Pid <= 0 {
		t.Fatalf("unexpected status %+v", status)
	}
	pid := status.Pid

	again, err := manager.Start(context.Background(), caller, ChannelStable)
	if err != nil {
		t.Fatalf("idempotent start: %v", err)
	}
	if again.Pid != pid {
		t.Fatalf("idempotent start changed pid: %d -> %d", pid, again.Pid)
	}

	stopped, err := manager.Stop(context.Background())
	if err != nil {
		t.Fatalf("stop: %v", err)
	}
	if stopped.State != StateStopped || stopped.Pid != 0 {
		t.Fatalf("unexpected stopped status %+v", stopped)
	}
	if processExists(pid) {
		t.Fatalf("core process %d still exists", pid)
	}
}

func TestStartWithoutConfigFails(t *testing.T) {
	manager, _ := newTestManager(t)
	if _, err := manager.Start(context.Background(), testCaller(), ChannelStable); err == nil {
		t.Fatal("expected failure without configuration")
	}
	status := manager.Status()
	if status.State != StateFailed {
		t.Fatalf("unexpected state %q", status.State)
	}
}

func TestStartRejectsOtherOwner(t *testing.T) {
	manager, _ := newTestManager(t)
	manager.current = &coreProcess{}
	manager.ownerUID = testCaller().UID + 1
	defer func() { manager.current = nil }()

	if _, err := manager.Start(context.Background(), testCaller(), ChannelStable); err == nil {
		t.Fatal("expected busy error")
	} else if rpcError, ok := err.(*RPCError); !ok || rpcError.Code != CodeBusy {
		t.Fatalf("unexpected error %v", err)
	}
}

func TestStopWhileRunning(t *testing.T) {
	manager, _ := newTestManager(t)
	caller := testCaller()
	if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelAlpha, Config: []byte(`{"log":{}}`)}); err != nil {
		t.Fatal(err)
	}
	if _, err := manager.Start(context.Background(), caller, ChannelAlpha); err != nil {
		t.Fatal(err)
	}

	if _, err := manager.Stop(context.Background()); err != nil {
		t.Fatalf("stop: %v", err)
	}
}
