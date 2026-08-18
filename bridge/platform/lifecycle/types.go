package lifecycle

import (
	"context"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

type InitAppEnvOptions struct {
	AppMenu  *menu.Menu
	Ctx      context.Context
	BasePath string
}

type InitAppEnvResult struct {
	WebviewPath string
}

type OnStartupOptions struct {
	ExecPath  string
	BasePath string
}

type OnStartupResult struct {
	IsSystemPackage bool
	IsBundled       bool
}
