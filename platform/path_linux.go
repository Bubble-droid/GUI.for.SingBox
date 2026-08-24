//go:build linux && !non_xdg

package platform

import (
	"log"
	"path/filepath"
	"strings"

	"guiforcores/config"

	"github.com/adrg/xdg"
)

func NewAppPaths(base string) *AppPaths {
	appID := config.Info.AppID
	appDataPath := filepath.Join(xdg.DataHome, appID)
	appConfigPath := filepath.Join(xdg.ConfigHome, appID)
	appCachePath := filepath.Join(xdg.CacheHome, appID)

	return &AppPaths{
		AppDataPath:   appDataPath,
		AppConfigPath: appConfigPath,
		AppCachePath:  appCachePath,
		BasePath:      base,
	}
}

func (p *AppPaths) LogStorageMode() {
	log.Println("Storage Mode: XDG Base Directory")
}

func (p *AppPaths) Resolve(cleanPath string) string {
	normalized := filepath.ToSlash(cleanPath)

	relPath := normalized
	if after, ok := strings.CutPrefix(normalized, "data/"); ok {
		relPath = after
	} else if normalized == "data" {
		relPath = ""
	}

	if strings.HasPrefix(relPath, "../") || relPath == ".." {
		return p.AppDataPath
	}

	if relPath == "" || relPath == "." {
		return p.AppDataPath
	}

	if strings.HasSuffix(relPath, ".yaml") && !strings.Contains(relPath, "/") {
		return filepath.Join(p.AppConfigPath, relPath)
	}

	if relPath == ".cache" {
		return p.AppCachePath
	}

	if after, ok := strings.CutPrefix(relPath, ".cache/"); ok {
		return filepath.Join(p.AppCachePath, after)
	}

	return filepath.Join(p.AppDataPath, filepath.FromSlash(relPath))
}
