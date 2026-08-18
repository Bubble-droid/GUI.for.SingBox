//go:build windows && !dev

package lifecycle

import (
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"

	platform_exec "guiforcores/bridge/platform/exec"
)

func InitAppEnv(opts InitAppEnvOptions) InitAppEnvResult {
	return InitAppEnvResult{
		WebviewPath: processFixedWebView2Runtime(opts.BasePath),
	}
}

func OnStartup(opts OnStartupOptions) OnStartupResult {
	return OnStartupResult{}
}

func processFixedWebView2Runtime(basePath string) string {
	webviewDir := filepath.Join(basePath, "data/WebView2")
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
	platform_exec.SetCmdWindowHidden(cmd)

	log.Println("Extracting WebView2 Runtime...")
	if err := cmd.Run(); err != nil {
		log.Printf("Extraction failed: %v\n", err)
		return ""
	}

	log.Printf("WebView2 Runtime extracted successfully into: %s\n", webviewDir)
	return strings.TrimSuffix(cabFile, ".cab")
}
