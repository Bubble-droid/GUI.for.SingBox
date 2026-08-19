//go:build linux && !dev

package lifecycle

import (
	_ "embed"
	"fmt"
	"guiforcores/bridge/config"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

//go:embed assets/appicon.png
var AppIcon []byte

func DetectPackage(execPath string) PackageInfo {
	sysPkg := isSystemPackage(execPath)
	bundled := isBundled(sysPkg)
	return PackageInfo{
		IsSystemPackage: sysPkg,
		IsBundled:       bundled,
	}
}

func InitAppEnv(opts InitAppEnvOptions) InitAppEnvResult {
	return InitAppEnvResult{}
}

func OnStartup(opts OnStartupOptions) {
	logPackageInfo(opts.IsSystemPackage, opts.IsBundled)
	setupPlatformIntegration(opts)
}

func setupPlatformIntegration(opts OnStartupOptions) {
	go func() {
		if !opts.IsSystemPackage {
			createDesktopEntry(opts.ExecPath)
			installAppIcon()
			return
		}

		if opts.IsBundled {
			createCoreSymlinks()
			return
		}
	}()
}

func createDesktopEntry(execPath string) {
	appID := config.Info.AppID
	userPath := filepath.Join(xdg.DataHome, "applications", fmt.Sprintf(`%s.desktop`, appID))
	systemPath := filepath.Join("/usr/share/applications", fmt.Sprintf(`%s.desktop`, appID))

	if _, err := os.Stat(systemPath); err == nil {
		return
	}
	if _, err := os.Stat(userPath); err == nil {
		return
	}

	log.Println("Creating desktop entry")

	content := strings.TrimSpace(fmt.Sprintf(`[Desktop Entry]
Type=Application
Version=1.0
Name=GUI for SingBox
Comment=A GUI client application for sing-box
Comment[zh_CN]=适用于 sing-box 的图形客户端
Exec=%s %%U
Icon=%s
Terminal=false
StartupNotify=true
StartupWMClass=%s
Categories=Network;Utility;
MimeType=x-scheme-handler/sing-box;
Keywords=gfs;gui;sb;singbox;
SingleMainWindow=true
Actions=quit;

[Desktop Action quit]
Exec=%s --quit
Name=Quit
Name[zh_CN]=退出应用
Icon=application-exit
`, execPath, appID, appID, execPath))

	_ = os.MkdirAll(filepath.Dir(userPath), 0755)
	_ = os.WriteFile(userPath, []byte(content), 0644)
}

func installAppIcon() {
	if len(AppIcon) == 0 {
		return
	}

	iconRelPath := fmt.Sprintf("icons/hicolor/512x512/apps/%s.png", config.Info.AppID)
	systemPath := filepath.Join("/usr/share", iconRelPath)
	userPath := filepath.Join(xdg.DataHome, iconRelPath)

	if _, err := os.Stat(systemPath); err == nil {
		return
	}
	if _, err := os.Stat(userPath); err == nil {
		return
	}

	log.Println("Creating application icon")

	_ = os.MkdirAll(filepath.Dir(userPath), 0755)
	_ = os.WriteFile(userPath, AppIcon, 0644)
}

func createCoreSymlinks() {
	appID := config.Info.AppID
	bundledCoresPath := fmt.Sprintf("/usr/lib/%s/cores", appID)
	appDataCorePath := filepath.Join(xdg.DataHome, appID, "sing-box")

	_ = os.MkdirAll(appDataCorePath, 0755)

	mappings := [][2]string{
		{"sing-box", "sing-box"},
		{"sing-box-alpha", "sing-box-latest"},
	}

	for _, m := range mappings {
		target := filepath.Join(bundledCoresPath, m[0])
		linkPath := filepath.Join(appDataCorePath, m[1])

		if _, err := os.Stat(target); os.IsNotExist(err) {
			continue
		}
		if _, err := os.Stat(linkPath); os.IsNotExist(err) {
			log.Println("Creating core symlinks")
			_ = os.Symlink(target, linkPath)
		}
	}
}

func isSystemPackage(exePath string) bool {
	if os.Getenv("SNAP") != "" || os.Getenv("container") == "flatpak" {
		return true
	}
	if _, err := os.Stat("/.flatpak-info"); err == nil {
		return true
	}

	systemPrefixes := []string{
		"/usr/bin/",
		"/usr/sbin/",
		"/usr/local/bin/",
		"/usr/local/sbin/",
		"/usr/lib/",
		"/opt/",
		"/nix/store/",
	}

	for _, prefix := range systemPrefixes {
		if strings.HasPrefix(exePath, prefix) {
			return true
		}
	}

	return !isWritable(filepath.Dir(exePath))
}

func isBundled(isSystemPackage bool) bool {
	if !isSystemPackage {
		return false
	}
	bundledCorePath := fmt.Sprintf("/usr/lib/%s/cores/sing-box", config.Info.AppID)
	_, err := os.Stat(bundledCorePath)
	return err == nil
}

func isWritable(dir string) bool {
	file, err := os.CreateTemp(dir, ".wails_write_test_*")
	if err != nil {
		return false
	}

	defer os.Remove(file.Name())

	file.Close()
	return true
}

func logPackageInfo(isSystemPackage bool, isBundled bool) {
	log.Printf("Install as System Package: %t", isSystemPackage)
	log.Printf("Cores Bundled Package: %t", isBundled)
	if isBundled {
		log.Printf("Bundled Sing-Box Core (Stable): v%s", config.Info.SingBoxVersion)
		log.Printf("Bundled Sing-Box Core (Alpha) : v%s", config.Info.SingBoxAlphaVersion)
	}
}
