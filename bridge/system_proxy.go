package bridge

import (
	"log"

	"guiforcores/bridge/platform/proxy"
)

func (a *App) GetSystemProxy() FlagResult {
	log.Printf("GetSystemProxy")

	proxyVal, err := proxy.GetSystemProxy()
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

	err := proxy.SetSystemProxy(enable, server, proxyType, bypass, services)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) SetSystemDNS(servers string, services []string) FlagResult {
	log.Printf("SetSystemDNS: %s %v", servers, services)

	err := proxy.SetSystemDNS(servers, services)
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, "Success"}
}

func (a *App) GetSystemProxyBypass() FlagResult {
	log.Printf("GetSystemProxyBypass")

	bypass, err := proxy.GetSystemProxyBypass()
	if err != nil {
		return FlagResult{false, err.Error()}
	}

	return FlagResult{true, bypass}
}
