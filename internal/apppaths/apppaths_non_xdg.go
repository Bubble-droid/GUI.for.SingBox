//go:build !linux || non_xdg

package apppaths

import (
	"path/filepath"
)

func New(base string) *Paths {
	baseDataDir := filepath.Join(base, "data")

	return &Paths{
		AppDataPath:   baseDataDir,
		AppConfigPath: baseDataDir,
		AppCachePath:  filepath.Join(baseDataDir, ".cache"),
		BasePath:      base,
	}
}

func (p *Paths) Resolve(cleanPath string) string {
	return filepath.Join(p.BasePath, cleanPath)
}
