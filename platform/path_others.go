//go:build !linux || non_xdg

package platform

import (
	"log"
	"path/filepath"
)

func NewAppPaths(base string) *AppPaths {
	baseDataDir := filepath.Join(base, "data")

	return &AppPaths{
		AppDataPath:   baseDataDir,
		AppConfigPath: baseDataDir,
		AppCachePath:  filepath.Join(baseDataDir, ".cache"),
		BasePath:      base,
	}
}

func (p *AppPaths) LogStorageMode() {
	log.Println("Storage Mode: Portable (Relative to Application Path)")
}

func (p *AppPaths) Resolve(cleanPath string) string {
	return filepath.Join(p.BasePath, cleanPath)
}
