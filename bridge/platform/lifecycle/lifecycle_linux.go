//go:build linux

package lifecycle

import (
	"context"
	"log"
	"os"
	"path/filepath"
	"strings"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

func IsSystemPackage(exePath string, appVersion string) bool {
	if appVersion == "dev" {
		return false
	}

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

func IsBundled(appVersion string) bool {
	if appVersion == "dev" {
		return false
	}
	_, err := os.Stat("/usr/lib/gui-for-singbox/cores/sing-box")
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
	log.Printf("Install as a System Package: %t", isSystemPackage)
	log.Printf("Bundled Package: %t", isBundled)
	if isBundled {
		log.Printf("Bundled Sing-Box Core (Stable): v%s", singBoxVersion)
		log.Printf("Bundled Sing-Box Core (Alpha) : v%s", singBoxAlphaVersion)
	}
}

func OnStartup(ctx context.Context, appMenu *menu.Menu, appName string, resolvePathFunc func(string) string) string {
	return ""
}
