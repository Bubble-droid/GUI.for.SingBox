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

func OnStartup(appName string, resolvePathFunc func(string) string) string {
	return ""
}

func CreateMacOSSymlink(appName string, basePath string) {
}

func CreateMacOSMenus(appMenu *menu.Menu, ctx context.Context) {
}
