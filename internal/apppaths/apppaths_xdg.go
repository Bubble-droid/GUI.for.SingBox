//go:build linux && !non_xdg

package apppaths

import (
	"os"
	"path/filepath"
	"strings"

	"guiforcores/internal/appinfo"
)

func getXDGDir(envKey, defaultRelPath, homeDir string) string {
	val := os.Getenv(envKey)
	if val != "" && filepath.IsAbs(val) {
		return val
	}

	if homeDir == "" {
		return ""
	}

	return filepath.Join(homeDir, defaultRelPath)
}

func New(base string) *Paths {
	id := appinfo.Current.ID
	homeDir, _ := os.UserHomeDir()

	dataHome := getXDGDir("XDG_DATA_HOME", filepath.Join(".local", "share"), homeDir)
	configHome := getXDGDir("XDG_CONFIG_HOME", ".config", homeDir)
	cacheHome := getXDGDir("XDG_CACHE_HOME", ".cache", homeDir)

	baseDataDir := filepath.Join(base, "data")

	appDataPath := baseDataDir
	if dataHome != "" {
		appDataPath = filepath.Join(dataHome, id)
	}

	appConfigPath := baseDataDir
	if configHome != "" {
		appConfigPath = filepath.Join(configHome, id)
	}

	appCachePath := filepath.Join(baseDataDir, ".cache")
	if cacheHome != "" {
		appCachePath = filepath.Join(cacheHome, id)
	}

	return &Paths{
		AppDataPath:   appDataPath,
		AppConfigPath: appConfigPath,
		AppCachePath:  appCachePath,
		BasePath:      base,
	}
}

func (p *Paths) Resolve(cleanPath string) string {
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
		return filepath.Join(p.AppConfigPath, filepath.FromSlash(relPath))
	}

	if relPath == ".cache" {
		return p.AppCachePath
	}

	if after, ok := strings.CutPrefix(relPath, ".cache/"); ok {
		return filepath.Join(p.AppCachePath, filepath.FromSlash(after))
	}

	return filepath.Join(p.AppDataPath, filepath.FromSlash(relPath))
}
