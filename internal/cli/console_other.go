//go:build !windows

package cli

import (
	"io"
	"os"
)

// setupConsoleStreams 在 UNIX-like 系统中直接沿用标准流
func setupConsoleStreams() (io.Writer, io.Writer, func()) {
	return os.Stdout, os.Stderr, func() {}
}
