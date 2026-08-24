//go:build !linux || non_xdg

package platform

import (
	"log"
	"path/filepath"
)

var basePath string

func InitAppPaths(base string) AppPaths {
	basePath = base
	baseDataDir := filepath.Join(basePath, "data")

	log.Println("Storage Mode: Portable (Relative to Application Path)")

	return AppPaths{
		AppDataPath:   baseDataDir,
		AppConfigPath: baseDataDir,
		AppCachePath:  filepath.Join(baseDataDir, ".cache"),
	}
}

func Resolve(cleanPath string) string {
	return filepath.Join(basePath, cleanPath)
}
