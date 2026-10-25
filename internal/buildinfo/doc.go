// Package buildinfo exposes version metadata for the binary.
//
// Values are populated from runtime/debug.ReadBuildInfo at init time, so a
// plain `go build` still reports the VCS revision, commit time and Go version.
// Release builds may override any of them with -ldflags, for example:
//
//	-X guiforcores/internal/buildinfo.GitVersion=v1.2.3
//	-X guiforcores/internal/buildinfo.GitCommit=abcdef0
//	-X guiforcores/internal/buildinfo.GitTreeState=clean
//	-X guiforcores/internal/buildinfo.BuildDate=2026-01-02T03:04:05Z
//	-X guiforcores/internal/buildinfo.BuiltBy=task.sh
//
// Overrides win because linker flags are applied before init runs.
package buildinfo
