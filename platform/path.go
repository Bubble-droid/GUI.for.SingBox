package platform

import (
	"log"
	"os"
	"path/filepath"
	"strings"
)

func (p *AppPaths) LogPathSummary() {
	if p == nil {
		return
	}
	p.LogStorageMode()
	log.Printf("App Data Path: %s", MaskUserHome(p.AppDataPath))
	log.Printf("App Config Path: %s", MaskUserHome(p.AppConfigPath))
	log.Printf("App Cache Path: %s", MaskUserHome(p.AppCachePath))
}

func MaskUserHome(targetPath string) string {
	if targetPath == "" {
		return ""
	}

	homeDir, err := os.UserHomeDir()
	if err != nil || homeDir == "" {
		return targetPath
	}

	rel, err := filepath.Rel(homeDir, targetPath)
	if err != nil || strings.HasPrefix(rel, "..") {
		return targetPath
	}

	if rel == "." {
		return "~"
	}

	return filepath.Join("~", rel)
}
