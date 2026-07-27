package bridge

import (
	"context"
	"embed"
	"guiforcores/bridge/platform/resolver"
	"log"
	"net"
	"os"
	"os/exec"
	"os/user"
	"path/filepath"
	"slices"
	"strings"

	sysruntime "runtime"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

var (
	AppName             = "gui-for-singbox"
	AppVersion          = "dev"
	SingBoxVersion      = "unknown"
	SingBoxAlphaVersion = "unknown"
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
	AppCorePath:     "",
}

// NewApp creates a new App application struct
func NewApp(fs embed.FS) *App {
	return &App{
		AppMenu: menu.NewMenu(),
		fs:      fs,
	}
}

func CreateApp(fs embed.FS) *App {
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	Env.BasePath = filepath.ToSlash(filepath.Dir(exePath))
	Env.AppName = filepath.Base(exePath)

	if slices.Contains(os.Args, "tasksch") {
		Env.FromTaskSch = true
	}

	if priv, err := IsPrivileged(); err == nil {
		Env.IsPrivileged = priv
	}

	app := NewApp(fs)

	if AppVersion != "" {
		Env.AppVersion = AppVersion
	}

	Env.IsSystemPackage = isSystemPackage(exePath)
	Env.IsBundled = IsBundled()

	var paths resolver.AppPaths
	globalPathResolver, paths = resolver.InitResolver(AppName, Env.BasePath, Env.AppVersion)

	Env.AppDataPath = paths.AppDataPath
	Env.AppConfigPath = paths.AppConfigPath
	Env.AppCachePath = paths.AppCachePath
	Env.AppCorePath = paths.AppCorePath

	loadConfig()

	return app
}

func (a *App) Startup(ctx context.Context) {
	a.Ctx = ctx

	log.Printf("Build Version: %s", Env.AppVersion)
	log.Printf("Install as a System Package: %t", Env.IsSystemPackage)
	log.Printf("Bundled Package: %t", Env.IsBundled)
	if Env.IsBundled {
		log.Printf("Bundled Sing-Box Core (Stable): v%s", SingBoxVersion)
		log.Printf("Bundled Sing-Box Core (Alpha) : v%s", SingBoxAlphaVersion)
	}

	if globalPathResolver != nil {
		globalPathResolver.LogStorageMode()
	}

	log.Printf("App Data Path: %s", Env.AppDataPath)
	log.Printf("App Config Path: %s", Env.AppConfigPath)
	log.Printf("App Cache Path: %s", Env.AppCachePath)

	if Env.OS == "darwin" {
		createMacOSSymlink()
		createMacOSMenus(a)
	}

	if Env.OS == "windows" {
		processFixedWebView2Runtime()
	}

	extractEmbeddedFiles(a.fs)
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
	exePath := resolvePath(Env.AppName)

	cmd := exec.Command(exePath)
	SetCmdWindowHidden(cmd)

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
		AppCorePath:     Env.AppCorePath,
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

func createMacOSSymlink() {
	currentUser, err := user.Current()
	if err != nil {
		log.Printf("Failed to resolve current user: %v", err)
		return
	}

	linkPath := resolvePath("data")
	appPath := filepath.Join("/Users", currentUser.Username, "Library", "Application Support", Env.AppName)

	if err := os.MkdirAll(appPath, os.ModePerm); err != nil {
		log.Printf("Failed to create macOS app data directory: %v", err)
		return
	}

	if err := os.Symlink(appPath, linkPath); err != nil && !os.IsExist(err) {
		log.Printf("Failed to create macOS data symlink: %v", err)
	}
}

func createMacOSMenus(app *App) {
	appMenu := app.AppMenu.AddSubmenu("App")
	appMenu.AddText("Show", keys.CmdOrCtrl("s"), func(_ *menu.CallbackData) {
		runtime.WindowShow(app.Ctx)
	})
	appMenu.AddText("Hide", keys.CmdOrCtrl("h"), func(_ *menu.CallbackData) {
		runtime.WindowHide(app.Ctx)
	})
	appMenu.AddSeparator()
	appMenu.AddText("Quit", keys.CmdOrCtrl("q"), func(_ *menu.CallbackData) {
		runtime.EventsEmit(app.Ctx, "onExitApp")
	})

	// on macos platform, we should append EditMenu to enable Cmd+C,Cmd+V,Cmd+Z... shortcut
	app.AppMenu.Append(menu.EditMenu())
}

func processFixedWebView2Runtime() {
	webviewDir := resolvePath("data/WebView2")

	err := filepath.Walk(webviewDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.EqualFold(info.Name(), "msedgewebview2.exe") {
			Env.WebviewPath = filepath.Dir(path)
			log.Printf("WebView2 runtime already exists at: %s", Env.WebviewPath)
			return filepath.SkipDir
		}
		return nil
	})

	if err != nil {
		log.Printf("Error during recursive search: %v\n", err)
		return
	}

	if Env.WebviewPath != "" {
		return
	}

	entries, err := os.ReadDir(webviewDir)
	if err != nil {
		log.Printf("Failed to read directory: %v\n", err)
		return
	}

	var cabFile string
	for _, e := range entries {
		if !e.IsDir() &&
			strings.HasSuffix(strings.ToLower(e.Name()), ".cab") &&
			strings.Contains(e.Name(), "Microsoft.WebView2.FixedVersionRuntime") {
			cabFile = filepath.Join(webviewDir, e.Name())
			break
		}
	}

	if cabFile == "" {
		log.Println("No WebView2 .cab file found. Skipping extraction.")
		return
	}

	log.Printf("Found CAB file: %s\n", cabFile)

	cmd := exec.Command("expand.exe", "-F:*", cabFile, webviewDir)
	SetCmdWindowHidden(cmd)

	log.Println("Extracting WebView2 Runtime...")
	if err := cmd.Run(); err != nil {
		log.Printf("Extraction failed: %v\n", err)
		return
	}

	log.Printf("WebView2 Runtime extracted successfully into: %s\n", webviewDir)
	Env.WebviewPath = strings.TrimSuffix(cabFile, ".cab")
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
