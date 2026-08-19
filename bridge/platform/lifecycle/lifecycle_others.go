//go:build (!windows && !darwin && !linux) || dev

package lifecycle

func DetectPackage(execPath string) PackageInfo {
	return PackageInfo{}
}

func InitAppEnv(opts InitAppEnvOptions) InitAppEnvResult {
	return InitAppEnvResult{}
}

func OnStartup(opts OnStartupOptions) {}
