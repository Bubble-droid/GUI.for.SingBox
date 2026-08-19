//go:build linux && !non_xdg

package path

import (
	"guiforcores/bridge/config"
	"log"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

var (
	dataDir   string // ~/.local/share/gui-for-singbox
	configDir string // ~/.config/gui-for-singbox
	cacheDir  string // ~/.cache/gui-for-singbox
)

func InitAppPaths(base string) AppPaths {
	appID := config.Info.AppID
	appDataPath := filepath.Join(xdg.DataHome, appID)
	appConfigPath := filepath.Join(xdg.ConfigHome, appID)
	appCachePath := filepath.Join(xdg.CacheHome, appID)

	dataDir = appDataPath
	configDir = appConfigPath
	cacheDir = appCachePath

	log.Println("Storage Mode: XDG Base Directory")

	return AppPaths{
		AppDataPath:   appDataPath,
		AppConfigPath: appConfigPath,
		AppCachePath:  appCachePath,
	}
}

func Resolve(cleanPath string) string {
	normalized := filepath.ToSlash(cleanPath)

	relPath := normalized
	if after, ok := strings.CutPrefix(normalized, "data/"); ok {
		relPath = after
	} else if normalized == "data" {
		relPath = ""
	}

	if strings.HasPrefix(relPath, "../") || relPath == ".." {
		return dataDir
	}

	if relPath == "" || relPath == "." {
		return dataDir
	}

	if strings.HasSuffix(relPath, ".yaml") && !strings.Contains(relPath, "/") {
		return filepath.Join(configDir, relPath)
	}

	if relPath == ".cache" {
		return cacheDir
	}

	if after, ok := strings.CutPrefix(relPath, ".cache/"); ok {
		return filepath.Join(cacheDir, after)
	}

	return filepath.Join(dataDir, filepath.FromSlash(relPath))
}
