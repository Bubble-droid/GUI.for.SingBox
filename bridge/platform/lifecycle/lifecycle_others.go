//go:build !windows && !darwin && !linux

package lifecycle

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

func IsSystemPackage(exePath string, appVersion string) bool {
	return false
}

func IsBundled(appVersion string) bool {
	return false
}

func LogPackageInfo(isSystemPackage bool, isBundled bool, singBoxVersion string, singBoxAlphaVersion string) {
}

func OnStartup(ctx context.Context, appMenu *menu.Menu, appName string, resolvePathFunc func(string) string) string {
	return ""
}
