package bridge

import (
	"crypto/tls"
	"encoding/base64"
	"errors"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/adrg/xdg"
	"golang.org/x/text/encoding/simplifiedchinese"
)

type requestTransportKey struct {
	Proxy    string
	Insecure bool
}

var requestTransportCache sync.Map

func GetDataDir(appName string) string {
	return filepath.Join(xdg.DataHome, normalizeDirName(appName))
}

func GetConfigDir(appName string) string {
	return filepath.Join(xdg.ConfigHome, normalizeDirName(appName))
}

func GetCacheDir(appName string) string {
	return filepath.Join(xdg.CacheHome, normalizeDirName(appName))
}

func normalizeDirName(name string) string {
	return strings.ReplaceAll(strings.ToLower(name), ".", "-")
}

func resolvePath(rawPath string) string {
	if rawPath == "" {
		return ""
	}

	cleanPath := filepath.Clean(rawPath)
	if filepath.IsAbs(cleanPath) {
		return cleanPath
	}

	appDataDir := Env.AppDataPath
	appConfigDir := Env.AppConfigPath
	appCacheDir := Env.AppCachePath

	normalized := filepath.ToSlash(cleanPath)

	var relPath string
	if normalized == "data" || normalized == "./data" {
		relPath = ""
	} else if after, ok := strings.CutPrefix(normalized, "data/"); ok {
		relPath = after
	} else if after0, ok0 := strings.CutPrefix(normalized, "./data/"); ok0 {
		relPath = after0
	} else {
		return filepath.Join(Env.BasePath, cleanPath)
	}

	if relPath == "" {
		return appDataDir
	}

	if relPath == "sing-box" || strings.HasPrefix(relPath, "sing-box/") {
		return filepath.Join(appCacheDir, filepath.FromSlash(relPath))
	}

	if after, ok := strings.CutPrefix(relPath, ".cache/"); ok {
		cacheRel := after
		return filepath.Join(appCacheDir, filepath.FromSlash(cacheRel))
	}
	if relPath == ".cache" {
		return appCacheDir
	}

	if strings.HasSuffix(relPath, ".yaml") && !strings.Contains(relPath, "/") {
		return filepath.Join(appConfigDir, filepath.FromSlash(relPath))
	}

	return filepath.Join(appDataDir, filepath.FromSlash(relPath))
}

func requestProxy(proxyAddr string) func(*http.Request) (*url.URL, error) {
	proxy := http.ProxyFromEnvironment

	if proxyAddr != "" {
		proxyUrl, err := url.Parse(proxyAddr)
		if err == nil {
			proxy = http.ProxyURL(proxyUrl)
		}
	}

	return proxy
}

func requestTimeout(timeout int) time.Duration {
	if timeout <= 0 {
		return 15 * time.Second
	}
	return time.Duration(timeout) * time.Second
}

func netPayloadBytes(payload string, options NetOptions) ([]byte, error) {
	if options.Mode == Binary {
		return base64.StdEncoding.DecodeString(payload)
	}
	return []byte(payload), nil
}

func netPayloadString(payload []byte, options NetOptions) string {
	if options.Mode == Binary {
		return base64.StdEncoding.EncodeToString(payload)
	}
	return string(payload)
}

func requestHeaders(headers map[string]string) http.Header {
	header := make(http.Header, len(headers))
	for key, value := range headers {
		header.Set(key, value)
	}
	return header
}

func requestTransport(options RequestOptions) *http.Transport {
	key := requestTransportKey{
		Proxy:    options.Proxy,
		Insecure: options.Insecure,
	}

	if value, ok := requestTransportCache.Load(key); ok {
		return value.(*http.Transport)
	}

	transport := http.DefaultTransport.(*http.Transport).Clone()
	transport.Proxy = requestProxy(options.Proxy)
	if options.Insecure {
		transport.TLSClientConfig = &tls.Config{
			InsecureSkipVerify: true,
		}
	}

	value, loaded := requestTransportCache.LoadOrStore(key, transport)
	if loaded {
		transport.CloseIdleConnections()
	}

	return value.(*http.Transport)
}

func decodeGB18030(data []byte) string {
	decodeBytes, _ := simplifiedchinese.GB18030.NewDecoder().Bytes(data)
	return string(decodeBytes)
}

func parseByteRange(s string, size int64) (start int64, end int64, err error) {
	if s == "" {
		return 0, size - 1, nil
	}

	s = strings.TrimSpace(s)

	// "bytes=100-200"
	s = strings.TrimPrefix(s, "bytes=")

	parts := strings.SplitN(s, "-", 2)
	if len(parts) != 2 {
		return 0, 0, errors.New("invalid range format")
	}

	startStr := strings.TrimSpace(parts[0])
	endStr := strings.TrimSpace(parts[1])

	// "-200" last 200 bytes
	if startStr == "" && endStr != "" {
		e, err2 := strconv.ParseInt(endStr, 10, 64)
		if err2 != nil || e < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		if e > size {
			start = 0
		} else {
			start = size - e
		}
		end = size - 1
		return start, end, nil
	}

	// "100-" from start to EOF
	if startStr != "" && endStr == "" {
		start, err = strconv.ParseInt(startStr, 10, 64)
		if err != nil || start < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		end = size - 1
		return start, end, nil
	}

	// "100-200"
	if startStr != "" && endStr != "" {
		start, err = strconv.ParseInt(startStr, 10, 64)
		if err != nil || start < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		end, err = strconv.ParseInt(endStr, 10, 64)
		if err != nil || end < 0 {
			return 0, 0, errors.New("invalid range value")
		}
		if start > end {
			return 0, 0, errors.New("invalid range: start > end")
		}
		if end >= size {
			end = size - 1
		}
		if start > end {
			return 0, 0, errors.New("invalid range: start exceeds file size")
		}
		return start, end, nil
	}

	return 0, 0, errors.New("invalid range format")
}

func RollingRelease(next http.Handler) http.Handler {
	isDevVersion := strings.Contains(Env.AppVersion, "dev")
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		url := r.URL.Path
		isIndex := url == "/"

		if isIndex {
			w.Header().Set("Cache-Control", "no-cache")
		} else {
			w.Header().Set("Cache-Control", "max-age=31536000, immutable")
		}

		if isDevVersion || !Config.RollingRelease {
			next.ServeHTTP(w, r)
			return
		}

		if isIndex {
			url = "/index.html"
		}

		filePath := resolvePath("data/rolling-release" + url)
		if _, err := os.Stat(filePath); err != nil {
			next.ServeHTTP(w, r)
			return
		}

		http.ServeFile(w, r, filePath)
	})
}
