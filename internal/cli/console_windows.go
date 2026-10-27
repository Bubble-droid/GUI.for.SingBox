//go:build windows

package cli

import (
	"io"
	"os"
	"syscall"
)

const attachParentProcess = ^uint32(0) // DWORD(-1): 附着到父进程终端

var (
	modkernel32       = syscall.NewLazyDLL("kernel32.dll")
	procAttachConsole = modkernel32.NewProc("AttachConsole")
	procFreeConsole   = modkernel32.NewProc("FreeConsole")
)

func attachConsole() bool {
	r, _, _ := procAttachConsole.Call(uintptr(attachParentProcess))
	return r != 0
}

func freeConsole() {
	procFreeConsole.Call()
}

// isHandleRedirected 检查句柄是否被管道或文件重定向
func isHandleRedirected(h syscall.Handle) bool {
	if h == 0 || h == syscall.InvalidHandle {
		return false
	}
	fileType, err := syscall.GetFileType(h)
	if err != nil {
		return false
	}
	// FILE_TYPE_DISK (1) 或 FILE_TYPE_PIPE (3)
	return fileType == syscall.FILE_TYPE_DISK || fileType == syscall.FILE_TYPE_PIPE
}

// setupConsoleStreams 为 Windows GUI 子系统接管父控制台屏幕缓冲
func setupConsoleStreams() (io.Writer, io.Writer, func()) {
	hStdout, _ := syscall.GetStdHandle(syscall.STD_OUTPUT_HANDLE)
	hStderr, _ := syscall.GetStdHandle(syscall.STD_ERROR_HANDLE)

	stdoutRedirected := isHandleRedirected(hStdout)
	stderrRedirected := isHandleRedirected(hStderr)

	// 若已重定向到文件或管道（如 app.exe -v > out.txt），直接使用标准输出
	if stdoutRedirected && stderrRedirected {
		return os.Stdout, os.Stderr, func() {}
	}

	attached := attachConsole()
	if !attached && !stdoutRedirected && !stderrRedirected {
		// 非终端唤起（桌面双击），使用缺省句柄
		return os.Stdout, os.Stderr, func() {}
	}

	var stdoutWriter io.Writer = os.Stdout
	var stderrWriter io.Writer = os.Stderr
	var toClose []io.Closer

	// 未重定向时将输出挂载到附着终端的设备 CONOUT$
	if !stdoutRedirected {
		conout, err := os.OpenFile("CONOUT$", os.O_WRONLY, 0)
		if err == nil {
			stdoutWriter = conout
			toClose = append(toClose, conout)
		}
	}

	if !stderrRedirected {
		conerr, err := os.OpenFile("CONOUT$", os.O_WRONLY, 0)
		if err == nil {
			stderrWriter = conerr
			toClose = append(toClose, conerr)
		}
	}

	cleanup := func() {
		for _, c := range toClose {
			_ = c.Close()
		}
		if attached {
			freeConsole()
		}
	}

	return stdoutWriter, stderrWriter, cleanup
}
