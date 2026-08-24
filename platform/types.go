package platform

type PackageInfo struct {
	IsSystemPackage bool
	IsBundled       bool
}

type OnStartupOptions struct {
	ExecPath string
	BasePath string
	PackageInfo
}

type AppPaths struct {
	AppDataPath   string
	AppConfigPath string
	AppCachePath  string
	BasePath      string
}
