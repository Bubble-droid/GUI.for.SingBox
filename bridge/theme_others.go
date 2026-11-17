//go:build !linux

package bridge

import "context"

// GetSystemTheme is only implemented on Linux, where the XDG portal exposes
// the desktop appearance. Other platforms keep using prefers-color-scheme.
func (a *App) GetSystemTheme() SystemTheme {
	return SystemTheme{Mode: "unknown", Source: "none"}
}

// StartSystemThemeWatch is only implemented on Linux, where the XDG portal
// exposes the desktop appearance. Other platforms keep using
// prefers-color-scheme.
func StartSystemThemeWatch(ctx context.Context) {}
