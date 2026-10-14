package apppaths

import (
	"os"
	"path/filepath"
	"testing"
)

func TestMaskUserHome(t *testing.T) {
	home, err := os.UserHomeDir()
	if err != nil || home == "" {
		t.Skip("user home directory unavailable")
	}

	tests := []struct {
		name string
		in   string
		want string
	}{
		{"empty", "", ""},
		{"home", home, "~"},
		{"child", filepath.Join(home, "a", "b"), filepath.Join("~", "a", "b")},
		{"outside", filepath.Join(filepath.Dir(home), "other"), filepath.Join(filepath.Dir(home), "other")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := MaskUserHome(tt.in); got != tt.want {
				t.Fatalf("MaskUserHome(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestResolvePath(t *testing.T) {
	p := &Paths{
		AppDataPath:   "/data/app",
		AppConfigPath: "/config/app",
		AppCachePath:  "/cache/app",
		BasePath:      "/base",
	}
	SetDefault(p)
	t.Cleanup(func() { SetDefault(nil) })

	abs := filepath.Join(string(filepath.Separator), "tmp", "file.txt")

	tests := []struct {
		name string
		in   string
		want string
	}{
		{"empty", "", ""},
		{"absolute", abs, filepath.ToSlash(abs)},
		{"relative", "logs/app.log", filepath.ToSlash(p.Resolve("logs/app.log"))},
		{"relative traversal", "../etc/passwd", filepath.ToSlash(p.Resolve("../etc/passwd"))},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := ResolvePath(tt.in, p.BasePath); got != tt.want {
				t.Fatalf("ResolvePath(%q) = %q, want %q", tt.in, got, tt.want)
			}
		})
	}
}

func TestResolvePathUsesRegisteredDefault(t *testing.T) {
	first := &Paths{BasePath: "/first", AppDataPath: "/first/data"}
	second := &Paths{BasePath: "/second", AppDataPath: "/second/data"}

	SetDefault(first)
	t.Cleanup(func() { SetDefault(nil) })

	gotFirst := ResolvePath("x", "/ignored")
	SetDefault(second)
	gotSecond := ResolvePath("x", "/ignored")

	if gotFirst == gotSecond {
		t.Fatalf("ResolvePath ignored the registered resolver: both returned %q", gotFirst)
	}
	if want := filepath.ToSlash(first.Resolve("x")); gotFirst != want {
		t.Fatalf("ResolvePath with first default = %q, want %q", gotFirst, want)
	}
	if want := filepath.ToSlash(second.Resolve("x")); gotSecond != want {
		t.Fatalf("ResolvePath with second default = %q, want %q", gotSecond, want)
	}
}

func TestEnsureDirs(t *testing.T) {
	root := t.TempDir()

	p := &Paths{
		AppDataPath:   filepath.Join(root, "data"),
		AppConfigPath: filepath.Join(root, "config"),
		AppCachePath:  filepath.Join(root, "cache"),
	}

	if err := p.EnsureDirs(); err != nil {
		t.Fatalf("EnsureDirs: %v", err)
	}

	for _, dir := range []string{p.AppDataPath, p.AppConfigPath, p.AppCachePath} {
		if info, err := os.Stat(dir); err != nil || !info.IsDir() {
			t.Fatalf("expected directory %q, got err=%v", dir, err)
		}
	}

	// Second call must be idempotent.
	if err := p.EnsureDirs(); err != nil {
		t.Fatalf("EnsureDirs (second call): %v", err)
	}
}

func TestEnsureDirsSkipsEmptyPaths(t *testing.T) {
	p := &Paths{}
	if err := p.EnsureDirs(); err != nil {
		t.Fatalf("EnsureDirs with empty paths: %v", err)
	}
}
