//go:build (!windows && !darwin && !linux) || dev

package platform

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

func InitAppEnv(execPath string) PackageInfo {
	return PackageInfo{}
}

func SetupApp(ctx context.Context, appMenu *menu.Menu, basePath string) string {
	return ""
}

func OnStartup(opts OnStartupOptions) {}
