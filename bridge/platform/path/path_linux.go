//go:build linux && !non_xdg

package path

import (
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

func InitResolver(appName string, basePath string) AppPaths {
	appDataPath := filepath.Join(xdg.DataHome, appName)
	appConfigPath := filepath.Join(xdg.ConfigHome, appName)
	appCachePath := filepath.Join(xdg.CacheHome, appName)
	appCorePath := filepath.Join(appDataPath, "sing-box")

	dataDir = appDataPath
	configDir = appConfigPath
	cacheDir = appCachePath

	return AppPaths{
		AppDataPath:   appDataPath,
		AppConfigPath: appConfigPath,
		AppCachePath:  appCachePath,
		AppCorePath:   appCorePath,
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

func LogStorageMode() {
	log.Println("Storage Mode: XDG Base Directory")
}
