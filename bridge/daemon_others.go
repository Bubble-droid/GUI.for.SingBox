//go:build !linux

package bridge

func daemonRequest(method string, params any, target any) error {
	return &DaemonError{
		Code:    daemonCodeUnavailable,
		Message: "core daemon is only available on Linux",
	}
}

func daemonWatchLoop(a *App, emit func(DaemonCoreStatus)) {}
