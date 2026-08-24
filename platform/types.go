package platform

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

type PackageInfo struct {
	IsSystemPackage bool
	IsBundled       bool
}

type InitAppEnvOptions struct {
	AppMenu  *menu.Menu
	Ctx      context.Context
	BasePath string
}

type InitAppEnvResult struct {
	WebviewPath string
}

type OnStartupOptions struct {
	ExecPath string
	BasePath string
	PackageInfo
}

type AppPaths struct {
	AppDataPath   string
	AppConfigPath string
	AppCachePath  string
}
