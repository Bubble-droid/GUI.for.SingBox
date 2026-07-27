//go:build windows

package proxy

import (
	"regexp"
	"strings"
)

func GetSystemProxy() (string, error) {
	return getWindowsSystemProxy()
}

func SetSystemProxy(enabled bool, server string, proxyType string, bypass string, services []string) error {
	return setWindowsSystemProxy(server, enabled, proxyType, bypass)
}

func SetSystemDNS(servers string, services []string) error {
	return nil
}

func GetSystemProxyBypass() (string, error) {
	return getWindowsSystemProxyBypass()
}

func getWindowsSystemProxy() (string, error) {
	out, err := runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD")
	if err != nil {
		return "", err
	}
	if regexp.MustCompile(`REG_DWORD\s+0x0`).MatchString(out) {
		return "", nil
	}

	out, err = runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyServer", "/t", "REG_SZ")
	if err != nil {
		return "", err
	}

	match := regexp.MustCompile(`ProxyServer\s+REG_SZ\s+(\S+)`).FindStringSubmatch(out)
	if len(match) < 2 {
		return "", nil
	}
	if strings.HasPrefix(match[1], "socks") {
		return match[1], nil
	}
	return "http://" + match[1], nil
}

func setWindowsSystemProxy(server string, enabled bool, proxyType string, bypass string) error {
	enabledValue := "0"
	proxyServer := ""
	if enabled {
		enabledValue = "1"
		proxyServer = server
		if proxyType == "socks" {
			proxyServer = "socks=" + server
		}
	}

	return runSystemProxyCommands(
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyEnable", "/t", "REG_DWORD", "/d", enabledValue, "/f"},
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyServer", "/d", proxyServer, "/f"},
		[]string{"reg", "add", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyOverride", "/d", normalizeBypass(bypass, ";"), "/f"},
	)
}

func getWindowsSystemProxyBypass() (string, error) {
	out, err := runSystemProxyCommand("reg", "query", `HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings`, "/v", "ProxyOverride")
	if err != nil {
		return "", err
	}
	match := regexp.MustCompile(`ProxyOverride\s+REG_SZ\s+(\S+)`).FindStringSubmatch(out)
	if len(match) < 2 {
		return "", nil
	}
	return match[1], nil
}
