//go:build darwin

package lifecycle

import (
	"context"
	"log"
	"os"
	"os/user"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
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
}

func CreateMacOSSymlink(appName string, basePath string) {
	linkPath := filepath.Join(basePath, "data")

	currentUser, err := user.Current()
	if err != nil {
		log.Printf("Failed to resolve current user: %v", err)
		return
	}

	appPath := filepath.Join("/Users", currentUser.Username, "Library", "Application Support", appName)

	if err := os.MkdirAll(appPath, os.ModePerm); err != nil {
		log.Printf("Failed to create macOS app data directory: %v", err)
		return
	}

	if err := os.Symlink(appPath, linkPath); err != nil && !os.IsExist(err) {
		log.Printf("Failed to create macOS data symlink: %v", err)
	}
}

func CreateMacOSMenus(appMenu *menu.Menu, ctx context.Context) {
	appMenuSub := appMenu.AddSubmenu("App")
	appMenuSub.AddText("Show", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.WindowShow(ctx)
	})
	appMenuSub.AddText("Hide", keys.CmdOrCtrl("h"), func(_ *menu.CallbackData) {
		runtime.WindowHide(ctx)
	})
	appMenuSub.AddSeparator()
	appMenuSub.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(ctx, "onExitApp")
	})

	appMenu.Append(menu.EditMenu())
}

func OnStartup(appName string, resolvePathFunc func(string) string) string {
	return ""
}
