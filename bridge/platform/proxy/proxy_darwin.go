//go:build darwin

package proxy

import (
	"regexp"
	"strings"
)

func GetSystemProxy() (string, error) {
	return getDarwinSystemProxy()
}

func SetSystemProxy(enabled bool, server string, proxyType string, bypass string, services []string) error {
	return setDarwinSystemProxy(server, enabled, proxyType, bypass, services)
}

func SetSystemDNS(servers string, services []string) error {
	return setDarwinSystemDNS(servers, services)
}

func GetSystemProxyBypass() (string, error) {
	return getDarwinSystemProxyBypass()
}

func getDarwinSystemProxy() (string, error) {
	out, err := runSystemProxyCommand("scutil", "--proxy")
	if err != nil {
		return "", err
	}

	values := map[string]string{}
	re := regexp.MustCompile(`(?m)^\s*(HTTPEnable|HTTPPort|HTTPProxy|SOCKSEnable|SOCKSPort|SOCKSProxy)\s*:\s*([^}\n]+)`)
	for _, match := range re.FindAllStringSubmatch(out, -1) {
		values[match[1]] = strings.TrimSpace(match[2])
	}

	if values["HTTPEnable"] == "1" {
		return "http://" + values["HTTPProxy"] + ":" + values["HTTPPort"], nil
	}
	if values["SOCKSEnable"] == "1" {
		return "socks5://" + values["SOCKSProxy"] + ":" + values["SOCKSPort"], nil
	}
	return "", nil
}

func setDarwinSystemProxy(server string, enabled bool, proxyType string, bypass string, services []string) error {
	commands := [][]string{}
	for _, device := range services {
		device = strings.TrimSpace(device)
		if device == "" {
			continue
		}
		state := "off"
		if enabled {
			state = "on"
		}

		httpState := "off"
		if proxyType == "mixed" || proxyType == "http" {
			httpState = state
		}

		socksState := "off"
		if proxyType == "mixed" || proxyType == "socks" {
			socksState = state
		}

		bypassItems := splitBypass(bypass)
		if len(bypassItems) == 0 {
			bypassItems = []string{"Empty"}
		}

		commands = append(commands,
			[]string{"networksetup", "-setwebproxystate", device, httpState},
			[]string{"networksetup", "-setsecurewebproxystate", device, httpState},
			[]string{"networksetup", "-setsocksfirewallproxystate", device, socksState},
			append([]string{"networksetup", "-setproxybypassdomains", device}, bypassItems...),
		)

		serverName, serverPort := splitServer(server)
		if httpState == "on" {
			commands = append(commands,
				[]string{"networksetup", "-setwebproxy", device, serverName, serverPort},
				[]string{"networksetup", "-setsecurewebproxy", device, serverName, serverPort},
			)
		}
		if socksState == "on" {
			commands = append(commands, []string{"networksetup", "-setsocksfirewallproxy", device, serverName, serverPort})
		}
	}
	return runSystemProxyCommands(commands...)
}

func setDarwinSystemDNS(servers string, services []string) error {
	dnsServers := splitCommaSeparated(servers)
	if len(dnsServers) == 0 {
		dnsServers = []string{"Empty"}
	}

	commands := make([][]string, 0, len(services))
	for _, service := range services {
		service = strings.TrimSpace(service)
		if service == "" {
			continue
		}
		commands = append(commands, append([]string{"networksetup", "-setdnsservers", service}, dnsServers...))
	}
	return runSystemProxyCommands(commands...)
}

func getDarwinSystemProxyBypass() (string, error) {
	result := []string{}
	for _, device := range []string{"Ethernet", "Wi-Fi"} {
		out, err := runSystemProxyCommand("networksetup", "-getproxybypassdomains", device)
		if err != nil {
			return "", err
		}
		if strings.TrimSpace(out) == "" {
			continue
		}
		for item := range strings.SplitSeq(strings.TrimSpace(out), "\n") {
			item = strings.TrimSpace(item)
			if item != "" {
				result = append(result, item)
			}
		}
	}
	return strings.Join(result, ";"), nil
}
