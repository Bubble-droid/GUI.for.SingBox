//go:build windows

package console

import (
	"os"
	"sync"
	"syscall"

	"golang.org/x/sys/windows"
)

const AttachParentProcess uintptr = ^uintptr(0) // (DWORD)-1

var (
	modKernel32       = windows.NewLazySystemDLL("kernel32.dll")
	procAttachConsole = modKernel32.NewProc("AttachConsole")

	mu sync.Mutex
)

func AttachParent() bool {
	mu.Lock()
	defer mu.Unlock()

	ret, _, _ := procAttachConsole.Call(AttachParentProcess)
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
