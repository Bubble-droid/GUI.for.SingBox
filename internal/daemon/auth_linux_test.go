//go:build linux

package daemon

import (
	"os"
	"testing"
)

func TestParseProcStatus(t *testing.T) {
	content := []byte("Name:\tsh\nUid:\t1000\t1000\t1000\t1000\nGid:\t1000\t1001\t1000\t1000\nGroups:\t1000 1001 2000\n")
	uid, gid, groups, err := parseProcStatus(content)
	if err != nil {
		t.Fatal(err)
	}
	if uid != 1000 {
		t.Fatalf("unexpected uid %d", uid)
	}
	if gid != 1001 {
		t.Fatalf("unexpected effective gid %d", gid)
	}
	if len(groups) != 3 || !containsGID(groups, 2000) {
		t.Fatalf("unexpected groups %v", groups)
	}

	if _, _, _, err := parseProcStatus([]byte("Uid:\n")); err == nil {
		t.Fatal("expected malformed Uid rejection")
	}
	if _, _, _, err := parseProcStatus([]byte("Uid:\tabc\n")); err == nil {
		t.Fatal("expected invalid Uid rejection")
	}
}

func TestParseProcStatusEffectiveFields(t *testing.T) {
	uid, gid, _, err := parseProcStatus([]byte("Uid:\t1000\t2000\t2000\t2000\nGid:\t100\t200\t100\t200\n"))
	if err != nil {
		t.Fatal(err)
	}
	if uid != 2000 || gid != 200 {
		t.Fatalf("unexpected effective credentials %d:%d", uid, gid)
	}

	uid, gid, _, err = parseProcStatus([]byte("Uid:\t1000\nGid:\t100\n"))
	if err != nil {
		t.Fatal(err)
	}
	if uid != 1000 || gid != 100 {
		t.Fatalf("unexpected fallback credentials %d:%d", uid, gid)
	}
}

func TestProcessStartTime(t *testing.T) {
	startTime, err := processStartTime(int32(os.Getpid()))
	if err != nil {
		t.Fatal(err)
	}
	if startTime == 0 {
		t.Fatal("unexpected zero start time")
	}
}

func TestVerifyAllowsRoot(t *testing.T) {
	authenticator := &GroupAuthenticator{name: "test", gid: 4242}
	caller, err := authenticator.Verify(PeerIdentity{UID: 0, GID: 0, PID: int32(os.Getpid())})
	if err != nil {
		t.Fatal(err)
	}
	if !caller.Root || caller.UID != 0 {
		t.Fatalf("unexpected caller %+v", caller)
	}
}

func TestVerifyRejectsOtherUser(t *testing.T) {
	if os.Getuid() == 0 {
		t.Skip("running as root")
	}
	authenticator := &GroupAuthenticator{name: "test", gid: 4242}
	identity := PeerIdentity{UID: uint32(os.Getuid()), GID: uint32(os.Getgid()), PID: int32(os.Getpid())}
	if _, err := authenticator.Verify(identity); err == nil {
		t.Fatal("expected group mismatch rejection")
	}
}

func TestVerifyCarriesSupplementaryGroups(t *testing.T) {
	if os.Getuid() == 0 {
		t.Skip("running as root")
	}
	status, err := os.ReadFile("/proc/self/status")
	if err != nil {
		t.Fatal(err)
	}
	_, _, groups, err := parseProcStatus(status)
	if err != nil {
		t.Fatal(err)
	}

	authenticator := &GroupAuthenticator{name: "test", gid: uint32(os.Getgid())}
	identity := PeerIdentity{UID: uint32(os.Getuid()), GID: uint32(os.Getgid()), PID: int32(os.Getpid())}
	caller, err := authenticator.Verify(identity)
	if err != nil {
		t.Fatal(err)
	}
	if len(caller.Groups) != len(groups) {
		t.Fatalf("unexpected groups %v, want %v", caller.Groups, groups)
	}
	for index, gid := range groups {
		if caller.Groups[index] != gid {
			t.Fatalf("unexpected groups %v, want %v", caller.Groups, groups)
		}
	}
}

func TestContainsGID(t *testing.T) {
	if !containsGID([]uint32{1, 2, 3}, 2) {
		t.Fatal("expected membership")
	}
	if containsGID([]uint32{1, 2, 3}, 4) {
		t.Fatal("unexpected membership")
	}
}
