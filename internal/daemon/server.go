//go:build linux

package daemon

import (
	"bufio"
	"context"
	"encoding/json"
	"errors"
	"io"
	"log"
	"net"
	"sync"
	"time"
)

const (
	requestTimeout    = 60 * time.Second
	connectionTimeout = 30 * time.Second
	maxConnections    = 16
)

// Server owns the Unix socket endpoint and dispatches authenticated requests.
type Server struct {
	listener net.Listener
	manager  *Manager
	auth     *GroupAuthenticator

	mu       sync.Mutex
	conns    map[net.Conn]struct{}
	closed   bool
	capacity chan struct{}
	wg       sync.WaitGroup
}

// NewServer creates a server around an already-bound listener.
func NewServer(listener net.Listener, manager *Manager, auth *GroupAuthenticator) *Server {
	return &Server{
		listener: listener,
		manager:  manager,
		auth:     auth,
		conns:    make(map[net.Conn]struct{}),
		capacity: make(chan struct{}, maxConnections),
	}
}

// Serve accepts connections until the listener is closed.
func (s *Server) Serve() error {
	for {
		conn, err := s.listener.Accept()
		if err != nil {
			if errors.Is(err, net.ErrClosed) || s.isClosed() {
				return nil
			}
			return err
		}

		select {
		case s.capacity <- struct{}{}:
		default:
			_ = conn.Close()
			continue
		}

		s.addConn(conn)
		s.wg.Add(1)
		go func() {
			defer s.wg.Done()
			defer func() { <-s.capacity }()
			s.handleConn(conn)
			s.removeConn(conn)
			_ = conn.Close()
		}()
	}
}

// Shutdown closes the listener and all active connections.
func (s *Server) Shutdown() {
	s.mu.Lock()
	if s.closed {
		s.mu.Unlock()
		return
	}
	s.closed = true
	_ = s.listener.Close()
	for conn := range s.conns {
		_ = conn.Close()
	}
	s.mu.Unlock()

	s.wg.Wait()
}

func (s *Server) isClosed() bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	return s.closed
}

func (s *Server) addConn(conn net.Conn) {
	s.mu.Lock()
	if s.closed {
		_ = conn.Close()
	} else {
		s.conns[conn] = struct{}{}
	}
	s.mu.Unlock()
}

func (s *Server) removeConn(conn net.Conn) {
	s.mu.Lock()
	delete(s.conns, conn)
	s.mu.Unlock()
}

func (s *Server) handleConn(conn net.Conn) {
	identity, err := peerIdentity(conn)
	if err != nil {
		log.Printf("daemon: reject connection: %v", err)
		s.writeError(conn, nil, newRPCError(CodeUnauthorized, "peer authentication failed", err.Error()))
		return
	}
	caller, err := s.auth.Verify(identity)
	if err != nil {
		log.Printf("daemon: reject uid %d: %v", identity.UID, err)
		s.writeError(conn, nil, toRPCError(err))
		return
	}

	scanner := bufio.NewScanner(conn)
	scanner.Buffer(make([]byte, 4096), MaxFrameSize)

	for {
		_ = conn.SetReadDeadline(time.Now().Add(connectionTimeout))
		if !scanner.Scan() {
			break
		}
		line := scanner.Bytes()
		if len(line) == 0 {
			continue
		}
		var req request
		if err := json.Unmarshal(line, &req); err != nil {
			s.writeError(conn, nil, newRPCError(CodeInvalidParams, "invalid JSON request", err.Error()))
			continue
		}
		if req.Method == "" {
			s.writeError(conn, req.ID, newRPCError(CodeInvalidParams, "missing method", nil))
			continue
		}

		if req.Method == MethodSubscribe {
			s.handleSubscribe(conn, req, caller)
			return
		}

		ctx, cancel := context.WithTimeout(context.Background(), requestTimeout)
		result, err := s.dispatch(ctx, caller, req)
		cancel()

		response := response{JSONRPC: jsonRPCVersion, ID: req.ID}
		if err != nil {
			response.Error = toRPCError(err)
			log.Printf("daemon: %s from uid %d failed: %v", req.Method, caller.UID, err)
		} else {
			response.Result = result
		}
		if !s.writeFrame(conn, response) {
			return
		}
	}

	if err := scanner.Err(); err != nil {
		if errors.Is(err, bufio.ErrTooLong) {
			s.writeError(conn, nil, newRPCError(CodeInvalidParams, "request frame is too large", nil))
			return
		}
		if !errors.Is(err, io.EOF) && !errors.Is(err, net.ErrClosed) {
			log.Printf("daemon: read from uid %d: %v", caller.UID, err)
		}
	}
}

func (s *Server) dispatch(ctx context.Context, caller Caller, req request) (any, error) {
	switch req.Method {
	case MethodInfo:
		return s.manager.Info(), nil
	case MethodStatus:
		return s.manager.Status(), nil
	case MethodConfigure:
		var params ConfigureParams
		if err := decodeParams(req.Params, &params); err != nil {
			return nil, err
		}
		return s.manager.Configure(caller, params)
	case MethodGetConfig:
		return s.manager.GetConfig(caller)
	case MethodStart:
		channel, err := channelParam(req.Params)
		if err != nil {
			return nil, err
		}
		return s.manager.Start(ctx, caller, channel)
	case MethodStop:
		return s.manager.Stop(ctx)
	case MethodRestart:
		channel, err := channelParam(req.Params)
		if err != nil {
			return nil, err
		}
		return s.manager.Restart(ctx, caller, channel)
	case MethodSwitch:
		channel, err := channelParam(req.Params)
		if err != nil {
			return nil, err
		}
		return s.manager.Switch(ctx, caller, channel)
	case MethodReadLog:
		var params ReadLogParams
		if err := decodeParams(req.Params, &params); err != nil {
			return nil, err
		}
		return s.manager.ReadLog(caller, params.TailBytes)
	case MethodClearCache:
		if err := s.manager.ClearCache(caller); err != nil {
			return nil, err
		}
		return struct{}{}, nil
	default:
		return nil, newRPCError(CodeMethodNotFound, "unknown method", req.Method)
	}
}

func (s *Server) handleSubscribe(conn net.Conn, req request, caller Caller) {
	subscriber := s.manager.Subscribe()
	defer s.manager.Unsubscribe(subscriber)

	acknowledge := response{
		JSONRPC: jsonRPCVersion,
		ID:      req.ID,
		Result:  map[string]bool{"subscribed": true},
	}
	if !s.writeFrame(conn, acknowledge) {
		return
	}

	_ = conn.SetReadDeadline(time.Time{})
	closed := make(chan struct{})
	go func() {
		buffer := make([]byte, 512)
		for {
			if _, err := conn.Read(buffer); err != nil {
				close(closed)
				return
			}
		}
	}()

	for {
		select {
		case event := <-subscriber.Events():
			if !s.writeFrame(conn, event) {
				return
			}
		case <-closed:
			return
		}
	}
}

func (s *Server) writeFrame(conn net.Conn, value any) bool {
	content, err := json.Marshal(value)
	if err != nil {
		log.Printf("daemon: encode response: %v", err)
		return false
	}
	content = append(content, '\n')
	_ = conn.SetWriteDeadline(time.Now().Add(connectionTimeout))
	if _, err := conn.Write(content); err != nil {
		return false
	}
	return true
}

func (s *Server) writeError(conn net.Conn, id json.RawMessage, err *RPCError) {
	if id == nil {
		id = json.RawMessage("null")
	}
	s.writeFrame(conn, response{JSONRPC: jsonRPCVersion, ID: id, Error: err})
}

func decodeParams(raw json.RawMessage, target any) error {
	if len(raw) == 0 || string(raw) == "null" {
		return nil
	}
	if err := json.Unmarshal(raw, target); err != nil {
		return newRPCError(CodeInvalidParams, "invalid parameters", err.Error())
	}
	return nil
}

func channelParam(raw json.RawMessage) (string, error) {
	var params ChannelParams
	if err := decodeParams(raw, &params); err != nil {
		return "", err
	}
	if err := validateChannel(params.Channel); err != nil {
		return "", err
	}
	return params.Channel, nil
}

func toRPCError(err error) *RPCError {
	if err == nil {
		return nil
	}
	var rpcError *RPCError
	if errors.As(err, &rpcError) {
		return rpcError
	}
	if errors.Is(err, context.DeadlineExceeded) {
		return newRPCError(CodeInvalidState, "request timed out", nil)
	}
	return newRPCError(CodeInternal, "internal error", err.Error())
}
