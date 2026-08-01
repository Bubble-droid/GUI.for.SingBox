package bridge

import (
	"log"

	platform_proxy "guiforcores/bridge/platform/proxy"
)

func (a *App) GetSystemProxy() FlagResult {
	log.Printf("GetSystemProxy")

	proxyVal, err := platform_proxy.GetSystemProxy()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, proxyVal}
}

func (a *App) SetSystemProxy(enable bool, server string, proxyType string, bypass string, services []string) FlagResult {
	log.Printf("SetSystemProxy: %t %s %s %s %v", enable, server, proxyType, bypass, services)

	if proxyType == "" {
		proxyType = "mixed"
	}

	err := platform_proxy.SetSystemProxy(enable, server, proxyType, bypass, services)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) SetSystemDNS(servers string, services []string) FlagResult {
	log.Printf("SetSystemDNS: %s %v", servers, services)

	err := platform_proxy.SetSystemDNS(servers, services)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) GetSystemProxyBypass() FlagResult {
	log.Printf("GetSystemProxyBypass")

	bypass, err := platform_proxy.GetSystemProxyBypass()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, bypass}
}
