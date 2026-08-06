package path

import (
	"log"
	"path/filepath"
)

type AppPaths struct {
	AppDataPath   string
	AppConfigPath string
	AppCachePath  string
}

var basePath string

func initPortable(base string) AppPaths {
	basePath = base
	baseDataDir := filepath.Join(basePath, "data")
	return AppPaths{
		AppDataPath:   baseDataDir,
		AppConfigPath: baseDataDir,
		AppCachePath:  filepath.Join(baseDataDir, ".cache"),
	}
}

func resolvePortable(cleanPath string) string {
	return filepath.Join(basePath, cleanPath)
}

func logPortableStorageMode() {
	log.Println("Storage Mode: Portable (Relative to Application Path)")
}
