//go:build linux

package daemon

import (
	"net"
	"os"
	"path/filepath"
	"testing"
	"time"
)

func TestCorePath(t *testing.T) {
	stable, alpha := "/usr/lib/gui-for-singbox/cores/sing-box", "/usr/lib/gui-for-singbox/cores/sing-box-alpha"
	if path, err := corePath(ChannelStable, stable, alpha); err != nil || path != stable {
		t.Fatalf("unexpected stable path %q (%v)", path, err)
	}
	if path, err := corePath(ChannelAlpha, stable, alpha); err != nil || path != alpha {
		t.Fatalf("unexpected alpha path %q (%v)", path, err)
	}
	if _, err := corePath("beta", stable, alpha); err == nil {
		t.Fatal("expected invalid channel rejection")
	}
}

func TestCredentialForCallerKeepsSupplementaryGroups(t *testing.T) {
	credential := credentialForCaller(Caller{UID: 1000, GID: 1001, Groups: []uint32{1001, 2000}})
	if credential.Uid != 1000 || credential.Gid != 1001 {
		t.Fatalf("unexpected credentials %d:%d", credential.Uid, credential.Gid)
	}
	if len(credential.Groups) != 2 || credential.Groups[0] != 1001 || credential.Groups[1] != 2000 {
		t.Fatalf("supplementary groups were not preserved: %v", credential.Groups)
	}
}

func TestValidateCoreBinary(t *testing.T) {
	core := writeFakeCore(t)
	if err := validateCoreBinary(core); err != nil {
		t.Fatalf("valid core rejected: %v", err)
	}

	writable := filepath.Join(t.TempDir(), "writable")
	if err := os.WriteFile(writable, []byte("#!/bin/sh\n"), 0o702); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(writable, 0o702); err != nil {
		t.Fatal(err)
	}
	if err := validateCoreBinary(writable); err == nil {
		t.Fatal("group-writable core accepted")
	}

	setuid := filepath.Join(t.TempDir(), "setuid")
	if err := os.WriteFile(setuid, []byte("#!/bin/sh\n"), 0o700); err != nil {
		t.Fatal(err)
	}
	if err := os.Chmod(setuid, 0o700|os.ModeSetuid); err != nil {
		t.Fatal(err)
	}
	if err := validateCoreBinary(setuid); err == nil {
		t.Fatal("setuid core accepted")
	}

	link := filepath.Join(t.TempDir(), "link")
	if err := os.Symlink(core, link); err != nil {
		t.Fatal(err)
	}
	if err := validateCoreBinary(link); err == nil {
		t.Fatal("symlink core accepted")
	}
}

func TestStartCoreProcessUsesFixedArguments(t *testing.T) {
	core := writeFakeCore(t)
	root := t.TempDir()
	stateDir := filepath.Join(root, "state")
	runtimeDir := filepath.Join(root, "run")
	workDir := filepath.Join(root, "work")
	for _, dir := range []string{stateDir, runtimeDir, workDir} {
		if err := os.MkdirAll(dir, 0o700); err != nil {
			t.Fatal(err)
		}
	}
	configPath := filepath.Join(workDir, "config.json")
	if err := os.WriteFile(configPath, []byte(`{"log":{}}`), 0o600); err != nil {
		t.Fatal(err)
	}
	logger, err := newLogWriter(filepath.Join(workDir, "core.log"), 1024, 1)
	if err != nil {
		t.Fatal(err)
	}

	process, err := startCoreProcess(core, configPath, workDir, stateDir, runtimeDir, uint32(os.Getuid()), ChannelStable, logger)
	if err != nil {
		t.Fatal(err)
	}
	defer func() {
		_ = stopCore(process, 3*time.Second)
		_ = logger.Close()
	}()

	expectedArgs := []string{core, "run", "--disable-color", "-c", configPath, "-D", workDir}
	if len(process.cmd.Args) != len(expectedArgs) {
		t.Fatalf("unexpected args %v", process.cmd.Args)
	}
	for index, value := range expectedArgs {
		if process.cmd.Args[index] != value {
			t.Fatalf("arg %d: %q != %q", index, process.cmd.Args[index], value)
		}
	}
	if process.cmd.SysProcAttr == nil || !process.cmd.SysProcAttr.Setpgid {
		t.Fatal("core is not started in its own process group")
	}
	if process.cmd.SysProcAttr.Credential != nil {
		t.Fatal("core must not drop credentials")
	}
	if process.cmd.SysProcAttr.AmbientCaps != nil {
		t.Fatal("core must not set ambient capabilities")
	}

	expectedEnv := coreEnvironment(stateDir, runtimeDir)
	if len(process.cmd.Env) != len(expectedEnv) {
		t.Fatalf("unexpected environment %v", process.cmd.Env)
	}
	for index, value := range expectedEnv {
		if process.cmd.Env[index] != value {
			t.Fatalf("env %d: %q != %q", index, process.cmd.Env[index], value)
		}
	}
	if process.pid <= 0 {
		t.Fatal("core has no pid")
	}
}

func TestStopCoreRemovesProcessGroup(t *testing.T) {
	core := writeFakeCore(t)
	root := t.TempDir()
	stateDir := filepath.Join(root, "state")
	runtimeDir := filepath.Join(root, "run")
	workDir := filepath.Join(root, "work")
	for _, dir := range []string{stateDir, runtimeDir, workDir} {
		if err := os.MkdirAll(dir, 0o700); err != nil {
			t.Fatal(err)
		}
	}
	configPath := filepath.Join(workDir, "config.json")
	if err := os.WriteFile(configPath, []byte(`{"log":{}}`), 0o600); err != nil {
		t.Fatal(err)
	}
	logger, err := newLogWriter(filepath.Join(workDir, "core.log"), 1024, 1)
	if err != nil {
		t.Fatal(err)
	}

	process, err := startCoreProcess(core, configPath, workDir, stateDir, runtimeDir, uint32(os.Getuid()), ChannelStable, logger)
	if err != nil {
		t.Fatal(err)
	}
	pid := process.pid
	if err := stopCore(process, 3*time.Second); err != nil {
		t.Fatal(err)
	}
	_ = logger.Close()
	if !process.requestedStop {
		t.Fatal("stop was not marked as requested")
	}
	if processExists(pid) {
		t.Fatalf("core process %d still exists", pid)
	}
}

func TestListenSocketCreatesSecureEndpoint(t *testing.T) {
	root := t.TempDir()
	runtimeDir := filepath.Join(root, "run")
	socketPath := filepath.Join(runtimeDir, "daemon.sock")

	listener, activated, err := ListenSocket(socketPath, runtimeDir, uint32(os.Getgid()))
	if err != nil {
		t.Fatal(err)
	}
	if activated {
		t.Fatal("unexpected socket activation outside systemd")
	}
	defer listener.Close()

	if _, ok := listener.(*net.UnixListener); !ok {
		t.Fatalf("unexpected listener type %T", listener)
	}
	socketInfo, err := os.Lstat(socketPath)
	if err != nil {
		t.Fatal(err)
	}
	if socketInfo.Mode()&os.ModeSocket == 0 || socketInfo.Mode().Perm() != 0o660 {
		t.Fatalf("unexpected socket mode %v", socketInfo.Mode())
	}
	dirInfo, err := os.Stat(runtimeDir)
	if err != nil {
		t.Fatal(err)
	}
	if dirInfo.Mode().Perm() != 0o750 {
		t.Fatalf("unexpected runtime directory mode %v", dirInfo.Mode())
	}
}

func TestListenSocketRejectsSymlink(t *testing.T) {
	root := t.TempDir()
	runtimeDir := filepath.Join(root, "run")
	if err := os.MkdirAll(runtimeDir, 0o750); err != nil {
		t.Fatal(err)
	}
	target := filepath.Join(root, "target")
	if err := os.WriteFile(target, nil, 0o600); err != nil {
		t.Fatal(err)
	}
	socketPath := filepath.Join(runtimeDir, "daemon.sock")
	if err := os.Symlink(target, socketPath); err != nil {
		t.Fatal(err)
	}
	if _, _, err := ListenSocket(socketPath, runtimeDir, uint32(os.Getgid())); err == nil {
		t.Fatal("expected symlink rejection")
	}
}
