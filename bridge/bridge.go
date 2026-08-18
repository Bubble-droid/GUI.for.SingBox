package bridge

import (
	"embed"

	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"slices"
	"strings"

	"guiforcores/bridge/config"
	platform_exec "guiforcores/bridge/platform/exec"
	platform_lifecycle "guiforcores/bridge/platform/lifecycle"
	platform_path "guiforcores/bridge/platform/path"
	sysruntime "runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

var Config = &AppConfig{}

var Env = &EnvResult{
	IsStartup:    true,
	PreventExit:  true,
	FromTaskSch:  false,
	WebviewPath:  "",
	AppName:      "",
	AppVersion:   "v1.26.1",
	BasePath:     "",
	OS:           sysruntime.GOOS,
	ARCH:         sysruntime.GOARCH,
	IsPrivileged: false,

	IsSystemPackage: false,
	IsBundled:       false,
	AppDataPath:     "",
	AppConfigPath:   "",
	AppCachePath:    "",
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		AppMenu: menu.NewMenu(),
	}
}

func CreateApp() *App {
	execPath := GetExecPath()

	Env.BasePath = filepath.ToSlash(filepath.Dir(execPath))
	Env.AppName = filepath.Base(execPath)

	if slices.Contains(os.Args, "tasksch") {
		Env.FromTaskSch = true
	}

	if priv, err := platform_exec.IsPrivileged(); err == nil {
		Env.IsPrivileged = priv
	}

	app := NewApp()

	if config.Info.AppVersion != "" {
		Env.AppVersion = config.Info.AppVersion
	}

	result := platform_lifecycle.InitAppEnv(platform_lifecycle.InitAppEnvOptions{
		AppMenu:  app.AppMenu,
		Ctx:      app.Ctx,
		BasePath: Env.BasePath,
	})

	if result.WebviewPath != "" {
		Env.WebviewPath = result.WebviewPath
	}

	paths := platform_path.InitResolver(config.Info.AppID, Env.BasePath)

	Env.AppDataPath = paths.AppDataPath
	Env.AppConfigPath = paths.AppConfigPath
	Env.AppCachePath = paths.AppCachePath

	loadConfig()

	return app
}

func Startup(fs embed.FS) {
	log.Printf("Build Version: %s", Env.AppVersion)

	platform_path.LogStorageMode()

	log.Printf("App Data Path: %s", Env.AppDataPath)
	log.Printf("App Config Path: %s", Env.AppConfigPath)
	log.Printf("App Cache Path: %s", Env.AppCachePath)

	result := platform_lifecycle.OnStartup(platform_lifecycle.OnStartupOptions{
		ExecPath: GetExecPath(),
		BasePath: Env.BasePath,
	})

	Env.IsSystemPackage = result.IsSystemPackage
	Env.IsBundled = result.IsBundled

	extractEmbeddedFiles(fs)
}

func (a *App) IsStartup() bool {
	if Env.IsStartup {
		Env.IsStartup = false
		return true
	}
	return false
}

func (a *App) ExitApp() {
	log.Printf("ExitApp")
	Env.PreventExit = false
	runtime.Quit(a.Ctx)
}

func (a *App) RestartApp() FlagResult {
	log.Printf("RestartApp")
	exePath := filepath.Join(Env.BasePath, Env.AppName)

	cmd := exec.Command(exePath)
	platform_exec.SetCmdWindowHidden(cmd)

	if err := cmd.Start(); err != nil {
		return FlagResult{false, err.Error()}
	}

	a.ExitApp()

	return FlagResult{true, "Success"}
}

func (a *App) GetEnv(key string) any {
	log.Printf("GetEnv: %s", key)
	if key != "" {
		return os.Getenv(key)
	}
	return EnvResult{
		AppName:      Env.AppName,
		AppVersion:   Env.AppVersion,
		BasePath:     Env.BasePath,
		OS:           Env.OS,
		ARCH:         Env.ARCH,
		IsPrivileged: Env.IsPrivileged,

		IsSystemPackage: Env.IsSystemPackage,
		IsBundled:       Env.IsBundled,
		AppDataPath:     Env.AppDataPath,
		AppConfigPath:   Env.AppConfigPath,
		AppCachePath:    Env.AppCachePath,
	}
}

func (a *App) GetInterfaces() FlagResult {
	log.Printf("GetInterfaces")

	interfaces, err := net.Interfaces()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	var interfaceNames []string

	for _, inter := range interfaces {
		interfaceNames = append(interfaceNames, inter.Name)
	}

	return FlagResult{true, strings.Join(interfaceNames, "|")}
}

func (a *App) ShowMainWindow() {
	log.Printf("ShowMainWindow")
	runtime.WindowShow(a.Ctx)
}

func extractEmbeddedFiles(fs embed.FS) {
	iconSrc := "frontend/dist/icons"
	iconDst := "data/.cache/icons"
	imgSrc := "frontend/dist/imgs"
	imgDst := "data/.cache/imgs"

	if err := os.MkdirAll(resolvePath(iconDst), os.ModePerm); err != nil {
		log.Printf("Failed to create icon cache directory: %v", err)
	}
	if err := os.MkdirAll(resolvePath(imgDst), os.ModePerm); err != nil {
		log.Printf("Failed to create image cache directory: %v", err)
	}

	extractFiles(fs, iconSrc, iconDst)
	extractFiles(fs, imgSrc, imgDst)
}

func extractFiles(fs embed.FS, srcDir, dstDir string) {
	files, err := fs.ReadDir(srcDir)
	if err != nil {
		log.Printf("Failed to read embedded files [%s]: %v", srcDir, err)
		return
	}

	for _, file := range files {
		fileName := file.Name()
		dstPath := resolvePath(dstDir + "/" + fileName)
		if _, err := os.Stat(dstPath); os.IsNotExist(err) {
			log.Printf("InitResources [%s]: %s", dstDir, fileName)
			data, err := fs.ReadFile(srcDir + "/" + fileName)
			if err != nil {
				log.Printf("Error reading embedded file %s: %v", fileName, err)
				continue
			}
			if err := os.WriteFile(dstPath, data, os.ModePerm); err != nil {
				log.Printf("Error writing file %s: %v", dstPath, err)
			}
		}
	}
}

func loadConfig() {
	b, err := os.ReadFile(resolvePath("data/user.yaml"))
	if err == nil {
		if err := yaml.Unmarshal(b, &Config); err != nil {
			log.Printf("Failed to parse user config: %v", err)
		}
	}

	if Config.Width == 0 {
		Config.Width = 800
	}

	if Config.Height == 0 {
		Config.Height = 540
	}

	Config.StartHidden = Env.FromTaskSch && Config.WindowStartState == int(options.Minimised)

	if !Env.FromTaskSch {
		Config.WindowStartState = int(options.Normal)
	}
}
