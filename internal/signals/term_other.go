//go:build !linux

package signals

// setupTerminalInterrupt is a no-op outside Linux, where the webview does not
// share the terminal's foreground process group.
func setupTerminalInterrupt() func() { return func() {} }
