//go:build windows

package platform

import (
	"os"
	"sync"
	"syscall"

	"golang.org/x/sys/windows"
)

var (
	mu sync.Mutex
)

func AttachParent() bool {
	mu.Lock()
	defer mu.Unlock()

	ret, _, _ := procAttachConsole.Call(attachParentProcess)
	if ret != 0 {
		rebindStdStreams()
		enableVirtualTerminal()
		return true
	}
	return false
}

func rebindStdStreams() {
	os.Stdout = os.NewFile(uintptr(syscall.Stdout), "/dev/stdout")
	os.Stderr = os.NewFile(uintptr(syscall.Stderr), "/dev/stderr")
}

func enableVirtualTerminal() {
	handle, err := windows.GetStdHandle(windows.STD_OUTPUT_HANDLE)
	if err != nil {
		return
	}
	var mode uint32
	if err := windows.GetConsoleMode(handle, &mode); err == nil {
		const enableVirtualTerminalProcessing = 0x0004
		_ = windows.SetConsoleMode(handle, mode|enableVirtualTerminalProcessing)
	}
}
