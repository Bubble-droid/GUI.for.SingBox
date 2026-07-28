//go:build linux && !dev

package lifecycle

import (
	"context"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
	"github.com/wailsapp/wails/v2/pkg/menu"
)

func SetupPlatformIntegration(isSystemPackage bool, isBundled bool, appName string) {
	go func() {

		if !isSystemPackage {
			createDesktopEntry(appName)
			installAppIcon(appName)
			return
		}

		if isBundled {
			createCoreSymlinks(appName)
			return
		}
	}()
}

func createDesktopEntry(appName string) {
	log.Println("Creating desktop entry")
	execPath, err := os.Executable()
	if err != nil {
		return
	}

	userPath := filepath.Join(xdg.DataHome, "applications", appName+".desktop")
	systemPath := filepath.Join("/usr/share/applications", appName+".desktop")

	if _, err := os.Stat(systemPath); err == nil {
		return
	}
	if _, err := os.Stat(userPath); err == nil {
		return
	}

	content := strings.TrimSpace(fmt.Sprintf(`[Desktop Entry]
Type=Application
Version=1.0
Name=GUI.for.SingBox
Name[zh_CN]=GUI for SingBox
Comment=A GUI client application for sing-box
Comment[zh_CN]=适用于 sing-box 的图形客户端
Exec=%s %%U
Icon=%s
Terminal=false
StartupNotify=true
StartupWMClass=%s
Categories=Network;Utility;
MimeType=application/x-sing-box-profile;x-scheme-handler/sing-box;
Keywords=gfs;gui;sb;singbox;
SingleMainWindow=true
Actions=quit;

[Desktop Action quit]
Exec=%s --quit
Name=Quit
Name[zh_CN]=退出应用
Icon=application-exit
`, execPath, appName, appName, execPath))

	_ = os.MkdirAll(filepath.Dir(userPath), 0755)
	_ = os.WriteFile(userPath, []byte(content), 0644)
}

func installAppIcon(appName string) {
	log.Println("Creating application icon")
	iconBytes := GetAppIcon()
	if len(iconBytes) == 0 {
		return
	}

	iconRelPath := fmt.Sprintf("icons/hicolor/512x512/apps/%s.png", appName)
	systemPath := filepath.Join("/usr/share", iconRelPath)
	userPath := filepath.Join(xdg.DataHome, iconRelPath)

	if _, err := os.Stat(systemPath); err == nil {
		return
	}
	if _, err := os.Stat(userPath); err == nil {
		return
	}

	_ = os.MkdirAll(filepath.Dir(userPath), 0755)
	_ = os.WriteFile(userPath, iconBytes, 0644)
}

func createCoreSymlinks(appName string) {
	log.Println("Creating core symlinks")
	bundledCoresPath := fmt.Sprintf("/usr/lib/%s/cores", appName)
	appDataCorePath := filepath.Join(xdg.DataHome, appName, "sing-box")

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
			_ = os.Symlink(target, linkPath)
		}

	}
}

func IsSystemPackage(execPath string) bool {
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
		if strings.HasPrefix(execPath, prefix) {
			return true
		}
	}

	return !isWritable(filepath.Dir(execPath))
}

func IsBundled(isSystemPackage bool, appName string) bool {
	if !isSystemPackage {
		return false
	}
	bundledCorePath := fmt.Sprintf("/usr/lib/%s/cores/sing-box", appName)
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

func LogPackageInfo(isSystemPackage bool, isBundled bool, singBoxVersion string, singBoxAlphaVersion string) {
	LogLinuxPackageInfo(isSystemPackage, isBundled, singBoxVersion, singBoxAlphaVersion)
}

func OnStartup(ctx context.Context, appMenu *menu.Menu, appName string, resolvePathFunc func(string) string) string {
	return ""
}
