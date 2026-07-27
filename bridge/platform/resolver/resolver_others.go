//go:build !linux

package resolver

func InitResolver(appName string, basePath string, appVersion string) (PathResolver, AppPaths) {
	return NewPortableResolver(basePath)
}
