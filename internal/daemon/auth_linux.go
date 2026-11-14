//go:build linux

package daemon

import (
	"bytes"
	"fmt"
	"net"
	"os"
	"os/user"
	"strconv"
	"strings"

	"golang.org/x/sys/unix"
)

// PeerIdentity is the kernel verified identity of a local socket peer.
type PeerIdentity struct {
	UID       uint32
	GID       uint32
	PID       int32
	StartTime uint64
}

// Caller is the authenticated caller passed to the manager.
//
// Groups keeps the caller's supplementary groups. They are needed when the
// daemon runs the configuration check as the caller: the check directory lives
// below the runtime directory, which is only searchable by the trusted group.
type Caller struct {
	UID    uint32
	GID    uint32
	Groups []uint32
	PID    int32
	Root   bool
}

// GroupAuthenticator verifies that a peer belongs to the trusted group.
type GroupAuthenticator struct {
	name string
	gid  uint32
}

// NewGroupAuthenticator resolves the trusted group once at startup.
func NewGroupAuthenticator(name string) (*GroupAuthenticator, error) {
	group, err := user.LookupGroup(name)
	if err != nil {
		return nil, fmt.Errorf("look up group %q: %w", name, err)
	}
	gid, err := strconv.ParseUint(group.Gid, 10, 32)
	if err != nil {
		return nil, fmt.Errorf("parse group %q GID: %w", name, err)
	}
	return &GroupAuthenticator{name: name, gid: uint32(gid)}, nil
}

func (a *GroupAuthenticator) GID() uint32 {
	return a.gid
}

func peerIdentity(conn net.Conn) (PeerIdentity, error) {
	unixConn, ok := conn.(*net.UnixConn)
	if !ok {
		return PeerIdentity{}, fmt.Errorf("daemon endpoint is not a Unix socket")
	}
	raw, err := unixConn.SyscallConn()
	if err != nil {
		return PeerIdentity{}, err
	}

	var credentials *unix.Ucred
	var credentialErr error
	if err := raw.Control(func(fd uintptr) {
		credentials, credentialErr = unix.GetsockoptUcred(int(fd), unix.SOL_SOCKET, unix.SO_PEERCRED)
	}); err != nil {
		return PeerIdentity{}, err
	}
	if credentialErr != nil {
		return PeerIdentity{}, credentialErr
	}
	if credentials == nil || credentials.Pid <= 0 {
		return PeerIdentity{}, fmt.Errorf("peer has invalid credentials")
	}

	status, err := os.ReadFile("/proc/" + strconv.Itoa(int(credentials.Pid)) + "/status")
	if err != nil {
		return PeerIdentity{}, fmt.Errorf("read peer process status: %w", err)
	}
	uid, gid, groups, err := parseProcStatus(status)
	if err != nil {
		return PeerIdentity{}, err
	}
	if uid != credentials.Uid {
		return PeerIdentity{}, fmt.Errorf("peer UID changed during authentication")
	}
	if !containsGID(groups, credentials.Gid) && gid != credentials.Gid {
		return PeerIdentity{}, fmt.Errorf("peer effective GID changed during authentication")
	}

	startTime, err := processStartTime(credentials.Pid)
	if err != nil {
		return PeerIdentity{}, err
	}

	return PeerIdentity{
		UID:       credentials.Uid,
		GID:       credentials.Gid,
		PID:       credentials.Pid,
		StartTime: startTime,
	}, nil
}

// Verify authorizes a peer identity. Root is always allowed so that recovery
// and diagnostics do not depend on group membership.
func (a *GroupAuthenticator) Verify(identity PeerIdentity) (Caller, error) {
	if identity.UID == 0 {
		return Caller{UID: identity.UID, GID: identity.GID, PID: identity.PID, Root: true}, nil
	}
	status, err := os.ReadFile("/proc/" + strconv.Itoa(int(identity.PID)) + "/status")
	if err != nil {
		return Caller{}, newRPCError(CodeUnauthorized, "read peer process status", err.Error())
	}
	uid, gid, groups, err := parseProcStatus(status)
	if err != nil {
		return Caller{}, newRPCError(CodeUnauthorized, "parse peer process status", err.Error())
	}
	if uid != identity.UID {
		return Caller{}, newRPCError(CodeUnauthorized, "peer UID mismatch", nil)
	}
	if !containsGID(groups, a.gid) && gid != a.gid && identity.GID != a.gid {
		return Caller{}, newRPCError(CodeUnauthorized, "peer is not in "+a.name, nil)
	}
	return Caller{UID: identity.UID, GID: identity.GID, Groups: groups, PID: identity.PID}, nil
}

func parseProcStatus(content []byte) (uint32, uint32, []uint32, error) {
	var uid, gid uint32
	var groups []uint32
	for _, line := range bytes.Split(content, []byte{'\n'}) {
		switch {
		case bytes.HasPrefix(line, []byte("Uid:")):
			fields := bytes.Fields(line[len("Uid:"):])
			if len(fields) == 0 {
				return 0, 0, nil, fmt.Errorf("invalid Uid line")
			}
			// The second field is the effective UID, which is what
			// SO_PEERCRED reports. Fall back to the real UID.
			field := fields[0]
			if len(fields) > 1 {
				field = fields[1]
			}
			value, err := strconv.ParseUint(string(field), 10, 32)
			if err != nil {
				return 0, 0, nil, fmt.Errorf("parse Uid: %w", err)
			}
			uid = uint32(value)
		case bytes.HasPrefix(line, []byte("Gid:")):
			fields := bytes.Fields(line[len("Gid:"):])
			if len(fields) == 0 {
				return 0, 0, nil, fmt.Errorf("invalid Gid line")
			}
			field := fields[0]
			if len(fields) > 1 {
				field = fields[1]
			}
			value, err := strconv.ParseUint(string(field), 10, 32)
			if err != nil {
				return 0, 0, nil, fmt.Errorf("parse Gid: %w", err)
			}
			gid = uint32(value)
		case bytes.HasPrefix(line, []byte("Groups:")):
			for _, field := range bytes.Fields(line[len("Groups:"):]) {
				value, err := strconv.ParseUint(string(field), 10, 32)
				if err != nil {
					return 0, 0, nil, fmt.Errorf("parse Groups: %w", err)
				}
				groups = append(groups, uint32(value))
			}
		}
	}
	return uid, gid, groups, nil
}

func containsGID(groups []uint32, gid uint32) bool {
	for _, value := range groups {
		if value == gid {
			return true
		}
	}
	return false
}

func processStartTime(pid int32) (uint64, error) {
	content, err := os.ReadFile("/proc/" + strconv.Itoa(int(pid)) + "/stat")
	if err != nil {
		return 0, fmt.Errorf("read peer process stat: %w", err)
	}
	commandEnd := bytes.LastIndexByte(content, ')')
	if commandEnd < 0 {
		return 0, fmt.Errorf("invalid peer process stat")
	}
	fields := strings.Fields(string(content[commandEnd+1:]))
	if len(fields) <= 19 {
		return 0, fmt.Errorf("incomplete peer process stat")
	}
	startTime, err := strconv.ParseUint(fields[19], 10, 64)
	if err != nil {
		return 0, fmt.Errorf("parse peer process start time: %w", err)
	}
	return startTime, nil
}
