package bridge

import (
	"guiforcores/internal/buildinfo"
)

// forkInit applies fork-only initialization once upstream has populated
// Env.BasePath and Env.AppName.
//
// Keeping all of it behind a single call keeps the diff in bridge.go limited
// to one line, which makes rebasing onto upstream cheaper.
func forkInit() {
	Env.AppVersion = buildinfo.GitVersion
}
