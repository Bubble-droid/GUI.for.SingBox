//go:build linux

package bridge

import (
	"bufio"
	"context"
	"encoding/json"
	"net"
	"path/filepath"
	"testing"
	"time"
)

func withTestDaemon(t *testing.T, handler func(net.Conn)) string {
	t.Helper()
	socketPath := filepath.Join(t.TempDir(), "daemon.sock")
	listener, err := net.Listen("unix", socketPath)
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { _ = listener.Close() })

	previous := daemonSocket
	daemonSocket = socketPath
	t.Cleanup(func() { daemonSocket = previous })

	go func() {
		conn, err := listener.Accept()
		if err != nil {
			return
		}
		defer conn.Close()
		handler(conn)
	}()
	return socketPath
}

func readRequest(t *testing.T, conn net.Conn) map[string]any {
	t.Helper()
	var request map[string]any
	if err := json.NewDecoder(bufio.NewReader(conn)).Decode(&request); err != nil {
		t.Fatalf("read request: %v", err)
	}
	return request
}

func writeFrame(t *testing.T, conn net.Conn, value any) {
	t.Helper()
	if err := json.NewEncoder(conn).Encode(value); err != nil {
		t.Fatalf("write frame: %v", err)
	}
}

func TestDaemonRequestSuccess(t *testing.T) {
	withTestDaemon(t, func(conn net.Conn) {
		request := readRequest(t, conn)
		if request["method"] != "core.status" {
			t.Errorf("unexpected method %v", request["method"])
		}
		writeFrame(t, conn, map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"result":  map[string]any{"state": "running", "pid": 42},
		})
	})

	var status DaemonCoreStatus
	if err := daemonRequest("core.status", nil, &status); err != nil {
		t.Fatal(err)
	}
	if status.State != "running" || status.Pid != 42 {
		t.Fatalf("unexpected status %+v", status)
	}
}

func TestDaemonRequestError(t *testing.T) {
	withTestDaemon(t, func(conn net.Conn) {
		readRequest(t, conn)
		writeFrame(t, conn, map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"error":   map[string]any{"code": -32004, "message": "core session is owned by another user"},
		})
	})

	err := daemonRequest("core.start", map[string]any{"channel": "stable"}, nil)
	var daemonErr *DaemonError
	if !asDaemonError(err, &daemonErr) {
		t.Fatalf("unexpected error %v", err)
	}
	if daemonErr.Code != -32004 {
		t.Fatalf("unexpected code %d", daemonErr.Code)
	}
}

func TestDaemonRequestUnavailable(t *testing.T) {
	previous := daemonSocket
	daemonSocket = filepath.Join(t.TempDir(), "missing.sock")
	t.Cleanup(func() { daemonSocket = previous })

	err := daemonRequest("core.status", nil, nil)
	var daemonErr *DaemonError
	if !asDaemonError(err, &daemonErr) {
		t.Fatalf("unexpected error %v", err)
	}
	if daemonErr.Code != daemonCodeUnavailable {
		t.Fatalf("unexpected code %d", daemonErr.Code)
	}
}

func TestDaemonSubscribe(t *testing.T) {
	withTestDaemon(t, func(conn net.Conn) {
		request := readRequest(t, conn)
		if request["method"] != "core.subscribe" {
			t.Errorf("unexpected method %v", request["method"])
		}
		writeFrame(t, conn, map[string]any{
			"jsonrpc": "2.0",
			"id":      1,
			"result":  map[string]any{"subscribed": true},
		})
		writeFrame(t, conn, map[string]any{
			"event": "core.state",
			"data":  map[string]any{"state": "running", "channel": "alpha", "pid": 7},
		})
		time.Sleep(50 * time.Millisecond)
	})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	statuses := make(chan DaemonCoreStatus, 1)
	go func() {
		_ = daemonSubscribe(ctx, func(status DaemonCoreStatus) {
			select {
			case statuses <- status:
			default:
			}
		})
	}()

	select {
	case status := <-statuses:
		if status.State != "running" || status.Channel != "alpha" || status.Pid != 7 {
			t.Fatalf("unexpected event %+v", status)
		}
	case <-time.After(5 * time.Second):
		t.Fatal("timed out waiting for event")
	}
	cancel()
}

func asDaemonError(err error, target **DaemonError) bool {
	value, ok := err.(*DaemonError)
	if ok {
		*target = value
	}
	return ok
}
