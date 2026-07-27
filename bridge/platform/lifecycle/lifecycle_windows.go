//go:build windows

package lifecycle

import (
	"context"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	platformexec "guiforcores/bridge/platform/exec"

	"github.com/wailsapp/wails/v2/pkg/menu"
)

func SetupPlatformIntegration(appVersion string, appName string) {}

func IsSystemPackage(exePath string, appVersion string) bool {
	return false
}

func IsBundled(appVersion string) bool {
	return false
}

func LogPackageInfo(isSystemPackage bool, isBundled bool, singBoxVersion string, singBoxAlphaVersion string) {
}

func ProcessFixedWebView2Runtime(resolvePathFunc func(string) string) string {
	webviewDir := resolvePathFunc("data/WebView2")
	webviewPath := ""

	err := filepath.Walk(webviewDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return nil
		}
		if !info.IsDir() && strings.EqualFold(info.Name(), "msedgewebview2.exe") {
			webviewPath = filepath.Dir(path)
			log.Printf("WebView2 runtime already exists at: %s", webviewPath)
			return filepath.SkipDir
		}
		return nil
	})

	if err != nil {
		log.Printf("Error during recursive search: %v\n", err)
		return ""
	}

	if webviewPath != "" {
		return webviewPath
	}

	entries, err := os.ReadDir(webviewDir)
	if err != nil {
		log.Printf("Failed to read directory: %v\n", err)
		return ""
	}

	var cabFile string
	for _, e := range entries {
		if !e.IsDir() &&
			strings.HasSuffix(strings.ToLower(e.Name()), ".cab") &&
			strings.Contains(e.Name(), "Microsoft.WebView2.FixedVersionRuntime") {
			cabFile = filepath.Join(webviewDir, e.Name())
			break
		}
	}

	if cabFile == "" {
		log.Println("No WebView2 .cab file found. Skipping extraction.")
		return ""
	}

	log.Printf("Found CAB file: %s\n", cabFile)

	cmd := exec.Command("expand.exe", "-F:*", cabFile, webviewDir)
	platformexec.SetCmdWindowHidden(cmd)

	log.Println("Extracting WebView2 Runtime...")
	if err := cmd.Run(); err != nil {
		log.Printf("Extraction failed: %v\n", err)
		return ""
	}

	log.Printf("WebView2 Runtime extracted successfully into: %s\n", webviewDir)
	return strings.TrimSuffix(cabFile, ".cab")
}

func OnStartup(ctx context.Context, appMenu *menu.Menu, appName string, resolvePathFunc func(string) string) string {
	return ProcessFixedWebView2Runtime(resolvePathFunc)
}
