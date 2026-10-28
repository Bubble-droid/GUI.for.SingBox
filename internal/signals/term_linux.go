//go:build linux

package signals

import (
	"os"
	"sync"
	"syscall"
	"unsafe"
)

// setupTerminalInterrupt stops Ctrl+C/Ctrl+\ from being broadcast to the
// whole foreground process group.
//
// GLib's g_spawn resets SIGINT to SIG_DFL in every WebKit child through
// POSIX_SPAWN_SETSIGDEF, so ignoring SIGINT in the parent cannot protect
// WebKitWebProcess. Disabling ISIG keeps the kernel from generating the
// signal at all; the byte is read from stdin and re-sent to this process
// only, leaving WebKit and sing-box untouched.
func setupTerminalInterrupt() func() {
	fi, err := os.Stdin.Stat()
	if err != nil || fi.Mode()&os.ModeCharDevice == 0 {
		return func() {}
	}

	var oldTerm syscall.Termios
	if _, _, errno := syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCGETS, uintptr(unsafe.Pointer(&oldTerm)), 0, 0, 0); errno != 0 {
		return func() {}
	}

	newTerm := oldTerm
	newTerm.Lflag &^= syscall.ISIG | syscall.ICANON
	newTerm.Cc[syscall.VMIN] = 1
	newTerm.Cc[syscall.VTIME] = 0

	if _, _, errno := syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCSETS, uintptr(unsafe.Pointer(&newTerm)), 0, 0, 0); errno != 0 {
		return func() {}
	}

	done := make(chan struct{})
	go func() {
		buf := make([]byte, 1)
		for {
			select {
			case <-done:
				return
			default:
			}

			n, err := os.Stdin.Read(buf)
			if err != nil {
				return
			}
			if n == 0 {
				continue
			}

			switch buf[0] {
			case 0x03: // Ctrl+C (ETX)
				_ = syscall.Kill(syscall.Getpid(), syscall.SIGINT)
			case 0x1c: // Ctrl+\ (FS)
				_ = syscall.Kill(syscall.Getpid(), syscall.SIGQUIT)
			}
		}
	}()

	var once sync.Once
	return func() {
		once.Do(func() {
			close(done)
			_, _, _ = syscall.Syscall6(syscall.SYS_IOCTL, uintptr(syscall.Stdin), syscall.TCSETS, uintptr(unsafe.Pointer(&oldTerm)), 0, 0, 0)
		})
	}
}
