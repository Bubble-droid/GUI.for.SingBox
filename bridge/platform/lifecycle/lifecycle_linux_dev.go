//go:build linux && dev

package lifecycle

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

func SetupPlatformIntegration(isSystemPackage bool, isBundled bool, appName string) {
}

func IsSystemPackage(exePath string) bool {
	return false
}

func IsBundled(isSystemPackage bool, appName string) bool {
	return false
}

func LogPackageInfo(isSystemPackage bool, isBundled bool, singBoxVersion string, singBoxAlphaVersion string) {
	LogLinuxPackageInfo(false, false, "", "")
}

func OnStartup(ctx context.Context, appMenu *menu.Menu, appName string, resolvePathFunc func(string) string) string {
	return ""
}
