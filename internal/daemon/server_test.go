//go:build linux

package daemon

import (
	"context"
	"encoding/json"
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"
)

type rpcClient struct {
	conn    net.Conn
	encoder *json.Encoder
	decoder *json.Decoder
}

func dialTestServer(t *testing.T, socketPath string) *rpcClient {
	t.Helper()
	conn, err := net.Dial("unix", socketPath)
	if err != nil {
		t.Fatal(err)
	}
	client := &rpcClient{conn: conn, encoder: json.NewEncoder(conn), decoder: json.NewDecoder(conn)}
	t.Cleanup(func() { _ = conn.Close() })
	return client
}

func (c *rpcClient) call(t *testing.T, id int, method string, params any) response {
	t.Helper()
	request := map[string]any{"jsonrpc": jsonRPCVersion, "id": id, "method": method}
	if params != nil {
		request["params"] = params
	}
	if err := c.encoder.Encode(request); err != nil {
		t.Fatal(err)
	}
	_ = c.conn.SetReadDeadline(time.Now().Add(20 * time.Second))
	var reply response
	if err := c.decoder.Decode(&reply); err != nil {
		t.Fatal(err)
	}
	return reply
}

func TestServerDispatch(t *testing.T) {
	manager, root := newTestManager(t)
	runtimeDir := filepath.Join(root, "run")
	socketPath := filepath.Join(runtimeDir, "daemon.sock")
	auth := &GroupAuthenticator{name: "test", gid: uint32(os.Getgid())}

	listener, _, err := ListenSocket(socketPath, runtimeDir, uint32(os.Getgid()))
	if err != nil {
		t.Fatal(err)
	}
	server := NewServer(listener, manager, auth)
	go func() { _ = server.Serve() }()
	t.Cleanup(server.Shutdown)

	client := dialTestServer(t, socketPath)
	caller := testCaller()

	reply := client.call(t, 1, MethodStatus, nil)
	if reply.Error != nil {
		t.Fatalf("status error: %v", reply.Error)
	}
	var status CoreStatus
	if err := decodeResult(reply.Result, &status); err != nil {
		t.Fatal(err)
	}
	if status.State != StateStopped {
		t.Fatalf("unexpected state %q", status.State)
	}

	reply = client.call(t, 2, MethodConfigure, ConfigureParams{Channel: ChannelStable, Config: json.RawMessage(`{"log":{}}`)})
	if reply.Error != nil {
		t.Fatalf("configure error: %v", reply.Error)
	}

	reply = client.call(t, 3, MethodStart, ChannelParams{Channel: ChannelStable})
	if reply.Error != nil {
		t.Fatalf("start error: %v", reply.Error)
	}
	if err := decodeResult(reply.Result, &status); err != nil {
		t.Fatal(err)
	}
	if status.State != StateRunning || status.Pid <= 0 || status.OwnerUID != caller.UID {
		t.Fatalf("unexpected start status %+v", status)
	}

	reply = client.call(t, 4, MethodInfo, nil)
	if reply.Error != nil {
		t.Fatalf("info error: %v", reply.Error)
	}
	var info CoreInfo
	if err := decodeResult(reply.Result, &info); err != nil {
		t.Fatal(err)
	}
	if len(info.Channels) != 2 {
		t.Fatalf("unexpected channels %+v", info.Channels)
	}

	reply = client.call(t, 5, MethodStop, nil)
	if reply.Error != nil {
		t.Fatalf("stop error: %v", reply.Error)
	}
}

func TestServerRejectsUnauthorizedGroup(t *testing.T) {
	manager, root := newTestManager(t)
	runtimeDir := filepath.Join(root, "run")
	socketPath := filepath.Join(runtimeDir, "daemon.sock")
	auth := &GroupAuthenticator{name: "test", gid: 1}
	if uint32(os.Getgid()) == 1 || os.Getuid() == 0 {
		t.Skip("test requires a non-root caller outside gid 1")
	}

	listener, _, err := ListenSocket(socketPath, runtimeDir, uint32(os.Getgid()))
	if err != nil {
		t.Fatal(err)
	}
	server := NewServer(listener, manager, auth)
	go func() { _ = server.Serve() }()
	t.Cleanup(server.Shutdown)

	client := dialTestServer(t, socketPath)
	reply := client.call(t, 1, MethodStatus, nil)
	if reply.Error == nil || reply.Error.Code != CodeUnauthorized {
		t.Fatalf("unexpected reply %+v", reply)
	}
}

func TestServerSubscribe(t *testing.T) {
	manager, root := newTestManager(t)
	runtimeDir := filepath.Join(root, "run")
	socketPath := filepath.Join(runtimeDir, "daemon.sock")
	auth := &GroupAuthenticator{name: "test", gid: uint32(os.Getgid())}

	listener, _, err := ListenSocket(socketPath, runtimeDir, uint32(os.Getgid()))
	if err != nil {
		t.Fatal(err)
	}
	server := NewServer(listener, manager, auth)
	go func() { _ = server.Serve() }()
	t.Cleanup(server.Shutdown)

	client := dialTestServer(t, socketPath)
	request := map[string]any{"jsonrpc": jsonRPCVersion, "id": 1, "method": MethodSubscribe}
	if err := client.encoder.Encode(request); err != nil {
		t.Fatal(err)
	}
	var acknowledge response
	if err := client.decoder.Decode(&acknowledge); err != nil {
		t.Fatal(err)
	}
	if acknowledge.Error != nil {
		t.Fatalf("subscribe error: %v", acknowledge.Error)
	}

	caller := testCaller()
	if _, err := manager.Configure(caller, ConfigureParams{Channel: ChannelStable, Config: []byte(`{"log":{}}`)}); err != nil {
		t.Fatal(err)
	}
	if _, err := manager.Start(context.Background(), caller, ChannelStable); err != nil {
		t.Fatal(err)
	}

	var event Event
	_ = client.conn.SetReadDeadline(time.Now().Add(10 * time.Second))
	if err := client.decoder.Decode(&event); err != nil {
		t.Fatal(err)
	}
	if event.Event != "core.state" {
		t.Fatalf("unexpected event %q", event.Event)
	}

	if _, err := manager.Stop(context.Background()); err != nil {
		t.Fatal(err)
	}
}

func decodeResult(raw any, target any) error {
	content, err := json.Marshal(raw)
	if err != nil {
		return err
	}
	return json.Unmarshal(content, target)
}
