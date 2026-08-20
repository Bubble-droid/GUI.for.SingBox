package main

import (
	"context"
	"embed"
	"fmt"
	"guiforcores/bridge"
	"guiforcores/bridge/config"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/logger"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/options/mac"
	"github.com/wailsapp/wails/v2/pkg/options/windows"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	cliOp := bridge.HandleCLI()
	if cliOp == bridge.CLIOpExitNow {
		return
	}

	app := bridge.CreateApp()

	trayStart, trayEnd := bridge.CreateTray(app, appIcon)
	var trayStarted bool

	uniqueID := config.Info.AppID
	if bridge.Config.MultipleInstance {
		uniqueID = fmt.Sprintf("%s-%d", config.Info.AppID, os.Getpid())
	}

	sigChan := make(chan os.Signal, 1)
	signal.Notify(sigChan, os.Interrupt, syscall.SIGINT, syscall.SIGTERM)
	go func() {
		<-sigChan
		bridge.Env.PreventExit = false

		if trayStarted {
			trayEnd()
		}
		if app.Ctx != nil {
			runtime.CleanupNotifications(app.Ctx)
			runtime.Quit(app.Ctx)
		}

		time.Sleep(100 * time.Millisecond)
		os.Exit(0)
	}()

	// Create application with options
	err := wails.Run(&options.App{
		MinWidth:         600,
		MinHeight:        400,
		DisableResize:    false,
		Menu:             app.AppMenu,
		Title:            config.Info.AppTitle,
		Frameless:        bridge.Env.OS != "darwin" && !bridge.Config.SystemTitleBar,
		Width:            bridge.Config.Width,
		Height:           bridge.Config.Height,
		StartHidden:      bridge.Config.StartHidden,
		WindowStartState: options.WindowStartState(bridge.Config.WindowStartState),
		BackgroundColour: &options.RGBA{R: 255, G: 255, B: 255, A: 1},
		Windows: &windows.Options{
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			ContentProtection:    bridge.Config.ContentProtection,
			BackdropType:         windows.Acrylic,
			WebviewBrowserPath:   bridge.Env.WebviewPath,
		},
		Mac: &mac.Options{
			TitleBar:             mac.TitleBarHiddenInset(),
			Appearance:           mac.DefaultAppearance,
			ContentProtection:    bridge.Config.ContentProtection,
			WebviewIsTransparent: true,
			WindowIsTranslucent:  true,
			About: &mac.AboutInfo{
				Title:   config.Info.AppTitle,
				Message: "© 2026 GUI.for.Cores",
				Icon:    appIcon,
			},
		},
		Linux: &linux.Options{
			Icon:                appIcon,
			WindowIsTranslucent: false,
			ProgramName:         config.Info.AppID,
			WebviewGpuPolicy:    linux.WebviewGpuPolicy(bridge.Config.WebviewGpuPolicy),
		},
		AssetServer: &assetserver.Options{
			Assets: assets,
		},
		SingleInstanceLock: &options.SingleInstanceLock{
			UniqueId: uniqueID,
			OnSecondInstanceLaunch: func(data options.SecondInstanceData) {
				if bridge.IsQuitArg(data.Args) {
					runtime.EventsEmit(app.Ctx, "onExitApp")
					return
				}
				runtime.Show(app.Ctx)
				runtime.EventsEmit(app.Ctx, "onLaunchApp", data.Args)
			},
		},
		OnStartup: func(ctx context.Context) {
			app.Ctx = ctx

			if cliOp == bridge.CLIOpForwardIPC && bridge.IsQuitArg(os.Args[1:]) {
				bridge.Env.PreventExit = false
				go func() {
					time.Sleep(50 * time.Millisecond)
					runtime.Quit(ctx)
				}()
				return
			}

			bridge.Startup(assets)
			runtime.InitializeNotifications(ctx)
			trayStart()
			trayStarted = true
		},
		OnBeforeClose: func(ctx context.Context) (prevent bool) {
			if !bridge.Env.PreventExit {
				if trayStarted {
					trayEnd()
				}
				runtime.CleanupNotifications(ctx)
				return false
			}
			runtime.EventsEmit(ctx, "onBeforeExitApp")
			return true
		},
		Bind: []any{
			app,
		},
		LogLevel: logger.INFO,
		Debug: options.Debug{
			OpenInspectorOnStartup: true,
		},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
