package bridge

import (
	"log"

	"guiforcores/internal/apppaths"
	"guiforcores/internal/buildinfo"
)

// appPaths is the fork-owned, XDG-aware path resolver. It is nil until
// forkInit runs; resolvePath lazily initializes it for tests and early calls.
var appPaths *apppaths.Paths

// forkInit applies fork-only initialization once upstream has populated
// Env.BasePath and Env.AppName.
//
// Keeping all of it behind a single call keeps the diff in bridge.go limited
// to one line, which makes rebasing onto upstream cheaper.
func forkInit() {
	Env.AppVersion = buildinfo.GitVersion

	appPaths = apppaths.New(Env.BasePath)
	apppaths.SetDefault(appPaths)
	if err := appPaths.EnsureDirs(); err != nil {
		log.Printf("EnsureDirs: %v", err)
	}
}
