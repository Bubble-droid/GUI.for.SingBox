//go:build darwin && !dev

package lifecycle

import (
	"context"
	"guiforcores/bridge/config"
	"log"
	"os"
	"os/user"
	"path/filepath"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

func DetectPackage(execPath string) PackageInfo {
	return PackageInfo{}
}

func InitAppEnv(opts InitAppEnvOptions) InitAppEnvResult {
	createMacOSMenus(opts.AppMenu, opts.Ctx)
	return InitAppEnvResult{}
}

func OnStartup(opts OnStartupOptions) {
	createMacOSSymlink(opts.BasePath)
}

func createMacOSSymlink(basePath string) {
	currentUser, err := user.Current()
	if err != nil {
		log.Printf("Failed to resolve current user: %v", err)
		return
	}

	linkPath := filepath.Join(basePath, "data")
	appPath := filepath.Join("/Users", currentUser.Username, "Library", "Application Support", config.Info.AppID)

	if err := os.MkdirAll(appPath, os.ModePerm); err != nil {
		log.Printf("Failed to create macOS app data directory: %v", err)
		return
	}

	if err := os.Symlink(appPath, linkPath); err != nil && !os.IsExist(err) {
		log.Printf("Failed to create macOS data symlink: %v", err)
	}
}

func createMacOSMenus(appMenu *menu.Menu, ctx context.Context) {
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
