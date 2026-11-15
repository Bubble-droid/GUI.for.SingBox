package bridge

import (
	"path/filepath"
	"testing"
)

func setTestEnv(t *testing.T, basePath string) {
	t.Helper()

	prevBasePath, prevDataDir, prevCacheDir, prevConfigDir := Env.BasePath, Env.DataDir, appCacheDir, appConfigDir
	t.Cleanup(func() {
		Env.BasePath = prevBasePath
		Env.DataDir = prevDataDir
		appCacheDir = prevCacheDir
		appConfigDir = prevConfigDir
	})

	Env.BasePath = filepath.ToSlash(basePath)
	Env.DataDir = filepath.ToSlash(basePath)
	appCacheDir = ""
	appConfigDir = ""
}

func TestResolvePath(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())
	cacheDir := filepath.ToSlash(t.TempDir())
	configDir := filepath.ToSlash(t.TempDir())

	setTestEnv(t, basePath)
	Env.DataDir = dataDir
	appCacheDir = cacheDir
	appConfigDir = configDir

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
			got := resolvePath(tt.path)
			t.Logf("input=%q resolved=%q", tt.path, got)

			if got != tt.want {
				t.Fatalf("resolvePath(%q) = %q, want %q", tt.path, got, tt.want)
			}
		})
	}
}

func TestResolvePathConfigFallback(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())

	setTestEnv(t, basePath)
	Env.DataDir = dataDir
	appConfigDir = ""

	got := resolvePath("data/config/user.yaml")
	want := filepath.ToSlash(filepath.Join(dataDir, "config", "user.yaml"))
	if got != want {
		t.Errorf("resolvePath(data/config/user.yaml) = %q, want %q", got, want)
	}
}

func TestResolvePathCacheFallback(t *testing.T) {
	basePath := filepath.ToSlash(t.TempDir())
	dataDir := filepath.ToSlash(t.TempDir())

	setTestEnv(t, basePath)
	Env.DataDir = dataDir
	appCacheDir = "" // Empty cache dir should fall back to dataDir/.cache

	got := resolvePath("data/.cache/icons/logo.png")
	want := filepath.ToSlash(filepath.Join(dataDir, ".cache", "icons", "logo.png"))
	if got != want {
		t.Errorf("resolvePath(data/.cache/icons/logo.png) = %q, want %q", got, want)
	}
}
