//go:build linux && non_xdg

package resolver

func InitResolver(appName string, basePath string) AppPaths {
	return initPortable(basePath)
}

func Resolve(cleanPath string) string {
	return resolvePortable(cleanPath)
}

func LogStorageMode() {
	logPortableStorageMode()
}
