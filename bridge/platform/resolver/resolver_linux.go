//go:build linux

package resolver

import (
	"log"
	"path/filepath"
	"strings"

	"github.com/adrg/xdg"
)

type XDGResolver struct {
	dataDir   string // ~/.local/share/gui-for-singbox
	configDir string // ~/.config/gui-for-singbox
	cacheDir  string // ~/.cache/gui-for-singbox
}

func (r *XDGResolver) Resolve(cleanPath string) string {
	normalized := filepath.ToSlash(cleanPath)

	relPath := normalized
	if after, ok := strings.CutPrefix(normalized, "data/"); ok {
		relPath = after
	} else if normalized == "data" {
		relPath = ""
	}

	if strings.HasPrefix(relPath, "../") || relPath == ".." {
		return r.dataDir
	}

	if relPath == "" || relPath == "." {
		return r.dataDir
	}

	if strings.HasSuffix(relPath, ".yaml") && !strings.Contains(relPath, "/") {
		return filepath.Join(r.configDir, relPath)
	}

	if relPath == ".cache" {
		return r.cacheDir
	}

	if after, ok := strings.CutPrefix(relPath, ".cache/"); ok {
		return filepath.Join(r.cacheDir, after)
	}

	return filepath.Join(r.dataDir, filepath.FromSlash(relPath))
}

func (r *XDGResolver) LogStorageMode() {
	log.Println("Storage Mode: XDG Base Directory")
}

func InitResolver(appName string, basePath string, appVersion string) (PathResolver, AppPaths) {
	if appVersion != "dev" {
		appDataPath := filepath.Join(xdg.DataHome, appName)
		appConfigPath := filepath.Join(xdg.ConfigHome, appName)
		appCachePath := filepath.Join(xdg.CacheHome, appName)
		appCorePath := filepath.Join(appDataPath, "sing-box")

		res := &XDGResolver{
			dataDir:   appDataPath,
			configDir: appConfigPath,
			cacheDir:  appCachePath,
		}

		paths := AppPaths{
			AppDataPath:   appDataPath,
			AppConfigPath: appConfigPath,
			AppCachePath:  appCachePath,
			AppCorePath:   appCorePath,
		}

		return res, paths
	}

	return NewPortableResolver(basePath)
}
