//go:build linux

package proxy

import (
	"encoding/json"
	"fmt"
	"os"
	"os/exec"
	"slices"
	"strings"
)

func GetSystemProxy() (string, error) {
	return getLinuxSystemProxy()
}

func SetSystemProxy(enabled bool, server string, proxyType string, bypass string, services []string) error {
	return setLinuxSystemProxy(server, enabled, proxyType, bypass)
}

func SetSystemDNS(servers string, services []string) error {
	return setLinuxSystemDNS(servers, services)
}

func GetSystemProxyBypass() (string, error) {
	return getLinuxSystemProxyBypass()
}

func getLinuxSystemProxy() (string, error) {
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kreadconfig := kdeReadCommand()
		if kreadconfig == "" {
			return "", fmt.Errorf("KDE detected but kreadconfig unavailable")
		}

		out, err := runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType")
		if err != nil {
			return "", err
		}
		if !strings.Contains(out, "1") {
			return "", nil
		}

		if out, err = runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpProxy"); err == nil {
			if proxy := cleanProxyValue(out); proxy != "" {
				return strings.ReplaceAll(proxy, " ", ":"), nil
			}
		} else {
			return "", err
		}

		if out, err = runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "socksProxy"); err == nil {
			if proxy := cleanProxyValue(out); proxy != "" {
				return strings.ReplaceAll(proxy, " ", ":"), nil
			}
		} else {
			return "", err
		}

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return "", err
		}
		if !hasSchema {
			return "", fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		out, err := runSystemProxyCommand("gsettings", "get", "org.gnome.system.proxy", "mode")
		if err != nil {
			return "", err
		}
		if strings.Contains(out, "none") {
			return "", nil
		}
		if !strings.Contains(out, "manual") {
			return "", nil
		}

		httpHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.http", "host")
		if err != nil {
			return "", err
		}
		httpPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.http", "port")
		if err != nil {
			return "", err
		}
		if httpHost != "" && httpPort != "0" {
			return "http://" + httpHost + ":" + httpPort, nil
		}

		httpsHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.https", "host")
		if err != nil {
			return "", err
		}
		httpsPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.https", "port")
		if err != nil {
			return "", err
		}
		if httpsHost != "" && httpsPort != "0" {
			return "https://" + httpsHost + ":" + httpsPort, nil
		}

		socksHost, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.socks", "host")
		if err != nil {
			return "", err
		}
		socksPort, err := systemProxyCommandValue("gsettings", "get", "org.gnome.system.proxy.socks", "port")
		if err != nil {
			return "", err
		}
		if socksHost != "" && socksPort != "0" {
			return "socks5://" + socksHost + ":" + socksPort, nil
		}

	case "unknown":
		return "", fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}

	return "", nil
}

func setLinuxSystemProxy(server string, enabled bool, proxyType string, bypass string) error {
	serverName, serverPort := splitServer(server)
	httpEnabled := enabled && (proxyType == "mixed" || proxyType == "http")
	socksEnabled := enabled && (proxyType == "mixed" || proxyType == "socks")
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kwriteconfig := kdeWriteCommand()
		if kwriteconfig == "" {
			return fmt.Errorf("KDE detected but kwriteconfig unavailable")
		}

		proxyTypeValue := "0"
		if enabled {
			proxyTypeValue = "1"
		}

		return runSystemProxyCommands(
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "ProxyType", proxyTypeValue},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpProxy", enabledURL(httpEnabled, "http://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "httpsProxy", enabledURL(httpEnabled, "http://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "socksProxy", enabledURL(socksEnabled, "socks://"+server)},
			[]string{kwriteconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "NoProxyFor", normalizeBypass(bypass, ",")},
		)

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return err
		}
		if !hasSchema {
			return fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		mode := "none"
		if enabled {
			mode = "manual"
		}
		bypassItems := splitBypass(bypass)
		quotedBypassItems := make([]string, 0, len(bypassItems))
		for _, item := range bypassItems {
			quotedBypassItems = append(quotedBypassItems, "'"+strings.ReplaceAll(item, "'", "\\'")+"'")
		}
		ignoreHosts := "[" + strings.Join(quotedBypassItems, ",") + "]"

		return runSystemProxyCommands(
			[]string{"gsettings", "set", "org.gnome.system.proxy", "mode", mode},
			[]string{"gsettings", "set", "org.gnome.system.proxy.http", "host", enabledURL(httpEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.http", "port", enabledURL(httpEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy.https", "host", enabledURL(httpEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.https", "port", enabledURL(httpEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy.socks", "host", enabledURL(socksEnabled, serverName)},
			[]string{"gsettings", "set", "org.gnome.system.proxy.socks", "port", enabledURL(socksEnabled, serverPort, "0")},
			[]string{"gsettings", "set", "org.gnome.system.proxy", "ignore-hosts", ignoreHosts},
		)

	default:
		return fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}
}

func setLinuxSystemDNS(servers string, services []string) error {
	dnsServers := splitCommaSeparated(servers)
	ipv4Servers := make([]string, 0, len(dnsServers))
	ipv6Servers := make([]string, 0, len(dnsServers))
	for _, server := range dnsServers {
		if strings.Contains(server, ":") {
			ipv6Servers = append(ipv6Servers, server)
		} else {
			ipv4Servers = append(ipv4Servers, server)
		}
	}
	ignoreAutoDNS := "yes"
	if len(dnsServers) == 0 {
		ignoreAutoDNS = "no"
	}

	for _, service := range services {
		service = strings.TrimSpace(service)
		if service == "" {
			continue
		}
		_, err := runSystemProxyCommand(
			"nmcli", "connection", "modify", service,
			"ipv4.ignore-auto-dns", ignoreAutoDNS, "ipv4.dns", strings.Join(ipv4Servers, ","),
			"ipv6.ignore-auto-dns", ignoreAutoDNS, "ipv6.dns", strings.Join(ipv6Servers, ","),
		)
		if err != nil {
			return err
		}
		if _, err := runSystemProxyCommand("nmcli", "connection", "up", service); err != nil {
			return err
		}
	}
	return nil
}

func getLinuxSystemProxyBypass() (string, error) {
	backend, desktop := detectProxyBackend()

	switch backend {
	case "kde":
		kreadconfig := kdeReadCommand()
		if kreadconfig == "" {
			return "", fmt.Errorf("KDE detected but kreadconfig unavailable")
		}

		out, err := runSystemProxyCommand(kreadconfig, "--file", "kioslaverc", "--group", "Proxy Settings", "--key", "NoProxyFor")
		if err != nil {
			return "", err
		}
		return normalizeBypass(strings.ReplaceAll(strings.TrimSpace(out), ",", ";"), ";"), nil

	case "gnome":
		hasSchema, err := hasGSettingsProxySchema()
		if err != nil {
			return "", err
		}
		if !hasSchema {
			return "", fmt.Errorf("GNOME-like desktop detected but org.gnome.system.proxy schema unavailable")
		}

		out, err := runSystemProxyCommand("gsettings", "get", "org.gnome.system.proxy", "ignore-hosts")
		if err != nil {
			return "", err
		}
		arrStart := strings.Index(out, "[")
		if arrStart >= 0 {
			out = out[arrStart:]
		}
		out = strings.ReplaceAll(out, "'", `"`)

		var items []string
		if err := json.Unmarshal([]byte(out), &items); err != nil {
			return "", err
		}
		return strings.Join(items, ";"), nil

	case "unknown":
		return "", fmt.Errorf("unsupported Linux proxy backend: %s", desktop)
	}

	return "", nil
}

func detectProxyBackend() (string, string) {
	desktop := strings.TrimSpace(os.Getenv("XDG_CURRENT_DESKTOP"))
	normalizedDesktop := strings.ToLower(desktop)

	tokens := strings.FieldsFunc(normalizedDesktop, func(r rune) bool {
		return r == ':' || r == ';' || r == ','
	})

	has := func(names ...string) bool {
		for _, token := range tokens {
			token = strings.TrimSpace(token)
			if slices.Contains(names, token) {
				return true
			}
		}
		return false
	}

	if has("kde", "plasma") {
		return "kde", desktop
	}

	if hasGSettingsProxyModeWritable() {
		return "gnome", desktop
	}

	return "unknown", desktop
}

func kdeWriteCommand() string {
	if _, err := exec.LookPath("kwriteconfig6"); err == nil {
		return "kwriteconfig6"
	}
	if _, err := exec.LookPath("kwriteconfig5"); err == nil {
		return "kwriteconfig5"
	}
	return ""
}

func kdeReadCommand() string {
	if _, err := exec.LookPath("kreadconfig6"); err == nil {
		return "kreadconfig6"
	}
	if _, err := exec.LookPath("kreadconfig5"); err == nil {
		return "kreadconfig5"
	}
	return ""
}

func hasGSettingsProxySchema() (bool, error) {
	out, err := runSystemProxyCommand("gsettings", "list-schemas")
	if err != nil {
		return false, err
	}
	return strings.Contains(out, "org.gnome.system.proxy"), nil
}

func hasGSettingsProxyModeWritable() bool {
	out, err := runSystemProxyCommand("gsettings", "writable", "org.gnome.system.proxy", "mode")
	return err == nil && strings.TrimSpace(out) == "true"
}
