package resolver

import (
	"log"
	"path/filepath"
)

type PathResolver interface {
	Resolve(cleanPath string) string
	LogStorageMode()
}

type AppPaths struct {
	AppDataPath   string
	AppConfigPath string
	AppCachePath  string
	AppCorePath   string
}

type PortableResolver struct {
	basePath string
}

func (r *PortableResolver) Resolve(cleanPath string) string {
	return filepath.Join(r.basePath, cleanPath)
}

func (r *PortableResolver) LogStorageMode() {
	log.Println("Storage Mode: Portable (Relative to Application Path)")
}

func NewPortableResolver(basePath string) (PathResolver, AppPaths) {
	baseDataDir := filepath.Join(basePath, "data")
	paths := AppPaths{
		AppDataPath:   baseDataDir,
		AppConfigPath: baseDataDir,
		AppCachePath:  filepath.Join(baseDataDir, ".cache"),
		AppCorePath:   filepath.Join(baseDataDir, "sing-box"),
	}
	return &PortableResolver{basePath: basePath}, paths
}
