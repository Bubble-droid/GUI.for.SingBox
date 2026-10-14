//go:build linux && !non_xdg

package apppaths

import (
	"path/filepath"
	"testing"
)

func TestPathsResolve(t *testing.T) {
	p := &Paths{
		AppDataPath:   "/xdg/data/gui-for-singbox",
		AppConfigPath: "/xdg/config/gui-for-singbox",
		AppCachePath:  "/xdg/cache/gui-for-singbox",
		BasePath:      "/opt/app",
	}

	tests := []struct {
		name string
		in   string
		want string
	}{
		{"empty", "", p.AppDataPath},
		{"data prefix", "data/sing-box/config.json", filepath.Join(p.AppDataPath, "sing-box/config.json")},
		{"data root", "data", p.AppDataPath},
		{"cache", "data/.cache", p.AppCachePath},
		{"cache child", "data/.cache/pkg.zip", filepath.Join(p.AppCachePath, "pkg.zip")},
		{"root yaml", "data/user.yaml", filepath.Join(p.AppConfigPath, "user.yaml")},
		{"nested yaml", "data/profiles/a.yaml", filepath.Join(p.AppDataPath, "profiles/a.yaml")},
		{"traversal", "data/../../etc/passwd", p.AppDataPath},
		{"plain path", "logs/app.log", filepath.Join(p.AppDataPath, "logs/app.log")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := p.Resolve(tt.in); got != tt.want {
				t.Fatalf("Resolve(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}
