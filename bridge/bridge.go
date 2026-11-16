package bridge

import (
	"embed"
	"log"
	"net"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	sysruntime "runtime"

	"github.com/Bubble-droid/GUI.for.SingBox/internal/build"
	"github.com/Bubble-droid/GUI.for.SingBox/internal/info"
	"github.com/Bubble-droid/GUI.for.SingBox/internal/storage"

	"github.com/wailsapp/wails/v2/pkg/menu"
	"github.com/wailsapp/wails/v2/pkg/menu/keys"
	"github.com/wailsapp/wails/v2/pkg/runtime"
	"gopkg.in/yaml.v3"
)

var Config = &AppConfig{}

// Store resolves logical paths against the directory layout resolved at
// startup.
var Store *storage.Storage

var Env = &EnvResult{
	IsStartup:    true,
	PreventExit:  true,
	WebviewPath:  "",
	AppName:      "",
	AppVersion:   "v1.28.1",
	BasePath:     "",
	DataDir:      "",
	OS:           sysruntime.GOOS,
	ARCH:         sysruntime.GOARCH,
	IsPrivileged: false,
}

// LaunchOptions carries the one-shot overrides parsed from the command line.
// Nothing here is persisted: normal startup always runs without arguments.
type LaunchOptions struct {
	DataDir  string
	Portable bool
	// WindowStartState is set by autostart entries and by an explicit
	// --window-start-state flag. Normal startup leaves it empty.
	WindowStartState string
}

// NewApp creates a new App application struct
func NewApp() *App {
	return &App{
		AppMenu: menu.NewMenu(),
	}
}

// initStorage resolves the data, cache and config directories from the
// injected build and environment values.
func initStorage(opts LaunchOptions) {
	Store = storage.New(storage.Config{
		BasePath:      Env.BasePath,
		OS:            Env.OS,
		SystemPackage: build.SystemPackage,
		Dev:           build.Dev,
		DataDir:       opts.DataDir,
		Portable:      opts.Portable,
	})

	paths := Store.Init()
	Env.DataDir = paths.DataDir
	Env.IsSystemPackage = paths.IsSystemPackage
	Env.IsBinaryDirWritable = paths.IsBinaryDirWritable
}

func CreateApp(opts LaunchOptions) *App {
	exePath, err := os.Executable()
	if err != nil {
		panic(err)
	}

	Env.BasePath = filepath.ToSlash(filepath.Dir(exePath))
	Env.AppName = filepath.Base(exePath)
	Env.FlagsFilePath = storage.LaunchFlagsPath()

	initStorage(opts)

	if info.Current.GitVersion != build.Unknown {
		Env.AppVersion = info.Current.GitVersion
	}

	if priv, err := IsPrivileged(); err == nil {
		Env.IsPrivileged = priv
	}

	app := NewApp()

	if Env.OS == "darwin" {
		createMacOSMenus(app)
	}

	if Env.OS == "windows" {
		processFixedWebView2Runtime()
	}

	loadConfig()

	// A command-line window state is a one-shot override for this run. Only
	// autostart entries pass it; normal startup carries no arguments and
	// always opens normally.
	Env.WindowStartState = WindowStartStateNormal
	if opts.WindowStartState != "" {
		Env.WindowStartState = WindowStartState(opts.WindowStartState)
	}

	return app
}

func Startup(fs embed.FS) {
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

func (a *App) GetEnv(key string) any {
	log.Printf("GetEnv: %s", key)
	if key != "" {
		return os.Getenv(key)
	}
	return EnvResult{
		AppName:      Env.AppName,
		AppVersion:   Env.AppVersion,
		BasePath:     Env.BasePath,
		DataDir:      Env.DataDir,
		OS:           Env.OS,
		ARCH:         Env.ARCH,
		IsPrivileged: Env.IsPrivileged,

		IsSystemPackage:     Env.IsSystemPackage,
		IsBinaryDirWritable: Env.IsBinaryDirWritable,
		FlagsFilePath:       Env.FlagsFilePath,
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
	webviewDir := filepath.Join(Env.DataDir, "WebView2")

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
		dstPath := resolvePath(filepath.Join(dstDir, fileName))
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
	b, err := os.ReadFile(resolvePath("data/config/user.yaml"))
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

	// Rolling release is globally disabled: never serve rolling-release assets
	Config.RollingRelease = false
}
