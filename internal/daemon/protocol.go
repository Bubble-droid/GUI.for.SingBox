//go:build linux

package daemon

import (
	"encoding/json"
	"fmt"
)

const (
	jsonRPCVersion = "2.0"

	// MaxFrameSize bounds a single NDJSON request frame.
	MaxFrameSize = 16 << 20
	// MaxConfigSize bounds a generated core configuration.
	MaxConfigSize = 16 << 20
	// MaxLogTail bounds the number of log bytes returned in one request.
	MaxLogTail = 1 << 20
)

// Version is the daemon build version, set by -ldflags.
var Version = "dev"

// JSON-RPC error codes used by the daemon protocol.
const (
	CodeMethodNotFound = -32601
	CodeUnauthorized   = -32001
	CodeUnavailable    = -32002
	CodeConfigInvalid  = -32003
	CodeBusy           = -32004
	CodeInvalidState   = -32005
	CodeInvalidParams  = -32006
	CodeInternal       = -32007
)

const (
	MethodInfo       = "daemon.info"
	MethodStatus     = "core.status"
	MethodConfigure  = "core.configure"
	MethodGetConfig  = "core.getConfig"
	MethodStart      = "core.start"
	MethodStop       = "core.stop"
	MethodRestart    = "core.restart"
	MethodSwitch     = "core.switch"
	MethodReadLog    = "core.readLog"
	MethodClearCache = "core.clearCache"
	MethodSubscribe  = "core.subscribe"
)

const (
	ChannelStable = "stable"
	ChannelAlpha  = "alpha"
)

type request struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id"`
	Method  string          `json:"method"`
	Params  json.RawMessage `json:"params"`
}

type response struct {
	JSONRPC string          `json:"jsonrpc"`
	ID      json.RawMessage `json:"id,omitempty"`
	Result  any             `json:"result,omitempty"`
	Error   *RPCError       `json:"error,omitempty"`
}

// Event is pushed to core.subscribe connections.
type Event struct {
	Event string `json:"event"`
	Data  any    `json:"data"`
}

// RPCError is a protocol-level error returned to the GUI.
type RPCError struct {
	Code    int    `json:"code"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

func (e *RPCError) Error() string {
	if e == nil {
		return ""
	}
	if e.Data == nil {
		return e.Message
	}
	return fmt.Sprintf("%s: %v", e.Message, e.Data)
}

func newRPCError(code int, message string, data any) *RPCError {
	return &RPCError{Code: code, Message: message, Data: data}
}

// ChannelParams selects a core channel.
type ChannelParams struct {
	Channel string `json:"channel"`
}

// ConfigureParams carries a generated configuration and its target channel.
type ConfigureParams struct {
	Channel string          `json:"channel"`
	Config  json.RawMessage `json:"config"`
}

// ReadLogParams selects how many trailing bytes to return.
type ReadLogParams struct {
	TailBytes int `json:"tailBytes"`
}

// CoreStatus is the public state snapshot.
type CoreStatus struct {
	State        string `json:"state"`
	Channel      string `json:"channel"`
	Pid          int    `json:"pid"`
	OwnerUID     uint32 `json:"ownerUid"`
	StartedAt    int64  `json:"startedAt"`
	LastError    string `json:"lastError"`
	ConfigSHA256 string `json:"configSha256"`
}

// CoreInfo describes the daemon and its packaged core channels.
type CoreInfo struct {
	Version  string        `json:"version"`
	Socket   string        `json:"socket"`
	Channels []ChannelInfo `json:"channels"`
}

// ChannelInfo describes one packaged core binary.
type ChannelInfo struct {
	Name    string `json:"name"`
	Path    string `json:"path"`
	Version string `json:"version"`
}

// ConfigureResult reports the committed configuration digest.
type ConfigureResult struct {
	SHA256 string `json:"sha256"`
	Bytes  int    `json:"bytes"`
}

// GetConfigResult returns the committed configuration for its owner.
type GetConfigResult struct {
	Config string `json:"config"`
	SHA256 string `json:"sha256"`
}

// ReadLogResult returns a bounded tail of the core log.
type ReadLogResult struct {
	Content   string `json:"content"`
	Truncated bool   `json:"truncated"`
}
