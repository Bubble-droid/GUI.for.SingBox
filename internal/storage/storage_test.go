package storage

import (
	"os"
	"path/filepath"
	"testing"
)

func newTestStorage(basePath string) *Storage {
	return New(Config{
		BasePath:      filepath.ToSlash(basePath),
		OS:            "linux",
		SystemPackage: "unknown",
	})
}

func TestResolvePath(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())
	cacheDir := filepath.ToSlash(t.TempDir())
	configDir := filepath.ToSlash(t.TempDir())

	s := newTestStorage(basePath)
	s.paths.DataDir = dataDir
	s.paths.CacheDir = cacheDir
	s.paths.ConfigDir = configDir

	underBase := func(parts ...string) string {
		return filepath.ToSlash(filepath.Join(append([]string{basePath}, parts...)...))
	}
	underData := func(parts ...string) string {
		return filepath.ToSlash(filepath.Join(append([]string{dataDir}, parts...)...))
	}
	underCache := func(parts ...string) string {
		return filepath.ToSlash(filepath.Join(append([]string{cacheDir}, parts...)...))
	}
	underConfig := func(parts ...string) string {
		return filepath.ToSlash(filepath.Join(append([]string{configDir}, parts...)...))
	}

	tests := []struct {
		name string
		path string
		want string
	}{
		{name: "empty", path: "", want: basePath},
		{name: "dot", path: ".", want: basePath},
		{name: "data directory", path: "data", want: dataDir},
		{name: "data directory trailing slash", path: "data/", want: dataDir},
		{name: "data file", path: "data/user.yaml", want: underData("user.yaml")},
		{name: "data duplicate slashes", path: "data//user.yaml", want: underData("user.yaml")},
		{name: "data dot segments", path: "./data/./user.yaml", want: underData("user.yaml")},
		{name: "data parent segments", path: "data/../data/user.yaml", want: underData("user.yaml")},
		{name: "data dot only", path: "data/.", want: dataDir},
		{name: "data parent only", path: "data/..", want: basePath},
		{name: "data prefix guard", path: "database/user.yaml", want: underBase("database", "user.yaml")},
		{name: "data name guard", path: "data.yaml", want: underBase("data.yaml")},
		{name: "data case guard", path: "DATA/user.yaml", want: underBase("DATA", "user.yaml")},
		{name: "data three dots", path: "data/...", want: underData("...")},
		{name: "base file", path: "logs/app.log", want: underBase("logs", "app.log")},
		{name: "unicode data file", path: "data/配置-😀/文件.yaml", want: underData("配置-😀", "文件.yaml")},
		{name: "space data file", path: "data/with space/file name.txt", want: underData("with space", "file name.txt")},
		{name: "leading space", path: " data/user.yaml", want: underBase(" data", "user.yaml")},

		// Cache paths
		{name: "cache directory", path: "data/.cache", want: cacheDir},
		{name: "cache file", path: "data/.cache/plugin-list.json", want: underCache("plugin-list.json")},
		{name: "cache icons", path: "data/.cache/icons/logo.png", want: underCache("icons", "logo.png")},

		// Config paths
		{name: "config directory", path: "data/config", want: configDir},
		{name: "config directory trailing slash", path: "data/config/", want: configDir},
		{name: "config file", path: "data/config/user.yaml", want: underConfig("user.yaml")},
		{name: "config nested file", path: "data/config/nested/file.yaml", want: underConfig("nested", "file.yaml")},
		{name: "config duplicate slashes", path: "data//config//user.yaml", want: underConfig("user.yaml")},
		{name: "config parent segments", path: "data/../data/config/user.yaml", want: underConfig("user.yaml")},
		{name: "config prefix guard", path: "data/configuration/user.yaml", want: underData("configuration", "user.yaml")},

		// Absolute paths are never remapped
		{name: "absolute data file", path: underData("user.yaml"), want: underData("user.yaml")},
		{name: "absolute base data directory", path: underBase("data"), want: underBase("data")},
		{name: "absolute base data file", path: underBase("data", "user.yaml"), want: underBase("data", "user.yaml")},
		{name: "plugin duplicate slashes", path: basePath + "//data//third//file.json", want: underBase("data", "third", "file.json")},
		{name: "plugin dot segments", path: basePath + "/./data/../data/user.yaml", want: underBase("data", "user.yaml")},
		{name: "plugin trailing slash", path: basePath + "/data/", want: underBase("data")},
		{name: "plugin unicode and spaces", path: basePath + "/data/配置 文件/😀.json", want: underBase("data", "配置 文件", "😀.json")},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := s.ResolvePath(tt.path)
			t.Logf("input=%q resolved=%q", tt.path, got)

			if got != tt.want {
				t.Fatalf("ResolvePath(%q) = %q, want %q", tt.path, got, tt.want)
			}
		})
	}
}

func TestResolvePathConfigFallback(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())

	s := newTestStorage(basePath)
	s.paths.DataDir = dataDir

	got := s.ResolvePath("data/config/user.yaml")
	want := filepath.ToSlash(filepath.Join(dataDir, "config", "user.yaml"))
	if got != want {
		t.Errorf("ResolvePath(data/config/user.yaml) = %q, want %q", got, want)
	}
}

func TestResolvePathCacheFallback(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())

	s := newTestStorage(basePath)
	s.paths.DataDir = dataDir // Empty cache dir should fall back to dataDir/.cache

	got := s.ResolvePath("data/.cache/icons/logo.png")
	want := filepath.ToSlash(filepath.Join(dataDir, ".cache", "icons", "logo.png"))
	if got != want {
		t.Errorf("ResolvePath(data/.cache/icons/logo.png) = %q, want %q", got, want)
	}
}

func TestExpandUserPath(t *testing.T) {
	t.Setenv("STORAGE_TEST_DIR", "/tmp/storage-test")

	homeDir, err := os.UserHomeDir()
	if err != nil {
		t.Skipf("no user home directory: %v", err)
	}

	tests := []struct {
		name    string
		value   string
		windows bool
		want    string
	}{
		{"posix env", "$STORAGE_TEST_DIR/data", false, "/tmp/storage-test/data"},
		{"brace env", "${STORAGE_TEST_DIR}/data", false, "/tmp/storage-test/data"},
		{"tilde", "~/data", false, filepath.Join(homeDir, "data")},
		{"windows tilde", `~\data`, false, filepath.Join(homeDir, "data")},
		{"windows percent env", "%STORAGE_TEST_DIR%/data", true, "/tmp/storage-test/data"},
		{"percent literal off windows", "%STORAGE_TEST_DIR%/data", false, "%STORAGE_TEST_DIR%/data"},
		{"unmatched percent", "100%/data", true, "100%/data"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := expandUserPath(tt.value, tt.windows); got != tt.want {
				t.Errorf("expandUserPath(%q, %v) = %q, want %q", tt.value, tt.windows, got, tt.want)
			}
		})
	}
}
