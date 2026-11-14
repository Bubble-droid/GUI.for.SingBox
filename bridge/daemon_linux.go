//go:build linux

package bridge

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"log"
	"net"
	"time"
)

const (
	daemonDialTimeout    = 5 * time.Second
	daemonRequestTimeout = 90 * time.Second
)

type daemonResponse struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Result  json.RawMessage `json:"result"`
	Error   *DaemonError    `json:"error"`
}

type daemonEventFrame struct {
	Event string          `json:"event"`
	Data  json.RawMessage `json:"data"`
}

var daemonSocket = daemonSocketPath

func dialDaemon() (net.Conn, error) {
	conn, err := net.DialTimeout("unix", daemonSocket, daemonDialTimeout)
	if err != nil {
		return nil, &DaemonError{
			Code:    daemonCodeUnavailable,
			Message: "core daemon is unavailable",
			Data:    err.Error(),
		}
	}
	return conn, nil
}

// daemonRequest sends one NDJSON request and decodes one response.
func daemonRequest(method string, params any, target any) error {
	conn, err := dialDaemon()
	if err != nil {
		return err
	}
	defer conn.Close()
	_ = conn.SetDeadline(time.Now().Add(daemonRequestTimeout))

	request := map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  method,
	}
	if params != nil {
		request["params"] = params
	}
	if err := json.NewEncoder(conn).Encode(request); err != nil {
		return &DaemonError{Code: daemonCodeUnavailable, Message: "send daemon request", Data: err.Error()}
	}

	var response daemonResponse
	if err := json.NewDecoder(bufio.NewReader(conn)).Decode(&response); err != nil {
		return &DaemonError{Code: daemonCodeUnavailable, Message: "read daemon response", Data: err.Error()}
	}
	if response.Error != nil {
		return response.Error
	}
	if target == nil {
		return nil
	}
	if len(response.Result) == 0 {
		return &DaemonError{Code: daemonCodeInternal, Message: "daemon returned an empty result"}
	}
	if err := json.Unmarshal(response.Result, target); err != nil {
		return &DaemonError{Code: daemonCodeInternal, Message: "decode daemon result", Data: err.Error()}
	}
	return nil
}

// daemonWatchLoop keeps one subscription alive and reconnects with backoff.
func daemonWatchLoop(a *App, emit func(DaemonCoreStatus)) {
	backoff := time.Second
	failing := false

	for {
		if a.Ctx.Err() != nil {
			return
		}

		err := daemonSubscribe(a.Ctx, emit)
		if a.Ctx.Err() != nil {
			return
		}
		if err != nil && !failing {
			log.Printf("daemon: state subscription: %v", err)
			failing = true
		}
		if err == nil {
			failing = false
		}

		select {
		case <-a.Ctx.Done():
			return
		case <-time.After(backoff):
		}
		if backoff < 30*time.Second {
			backoff *= 2
			if backoff > 30*time.Second {
				backoff = 30 * time.Second
			}
		}
	}
}

func daemonSubscribe(ctx context.Context, emit func(DaemonCoreStatus)) error {
	conn, err := dialDaemon()
	if err != nil {
		return err
	}
	defer conn.Close()

	closed := make(chan struct{})
	go func() {
		<-ctx.Done()
		_ = conn.Close()
		close(closed)
	}()

	if err := json.NewEncoder(conn).Encode(map[string]any{
		"jsonrpc": "2.0",
		"id":      1,
		"method":  "core.subscribe",
	}); err != nil {
		return fmt.Errorf("send subscription: %w", err)
	}

	decoder := json.NewDecoder(bufio.NewReader(conn))

	var acknowledge daemonResponse
	if err := decoder.Decode(&acknowledge); err != nil {
		return fmt.Errorf("read subscription acknowledgement: %w", err)
	}
	if acknowledge.Error != nil {
		return acknowledge.Error
	}

	for {
		var frame daemonEventFrame
		if err := decoder.Decode(&frame); err != nil {
			select {
			case <-closed:
				return nil
			default:
			}
			if errors.Is(err, net.ErrClosed) || ctx.Err() != nil {
				return nil
			}
			return fmt.Errorf("read subscription event: %w", err)
		}
		if frame.Event != "core.state" {
			continue
		}
		var status DaemonCoreStatus
		if err := json.Unmarshal(frame.Data, &status); err != nil {
			continue
		}
		emit(status)
	}
}
