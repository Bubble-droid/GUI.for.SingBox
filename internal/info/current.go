// Package info describes the running application build.
package info

import "github.com/Bubble-droid/GUI.for.SingBox/internal/build"

// Info is the shape of the running build identity.
type Info struct {
	GitVersion    string
	GitCommit     string
	GitTreeState  string
	BuildDate     string
	BuiltBy       string
	GoVersion     string
	Compiler      string
	ModuleSum     string
	Platform      string
	SystemPackage string
	Dev           bool
}

// Current is the identity of the running build. The binary has exactly one
// identity for its whole lifetime, so it is resolved once here instead of
// being loaded by each caller. Future runtime facts can be added as fields
// without changing consumers.
var Current = Info{
	GitVersion:    build.GitVersion,
	GitCommit:     build.GitCommit,
	GitTreeState:  build.GitTreeState,
	BuildDate:     build.BuildDate,
	BuiltBy:       build.BuiltBy,
	GoVersion:     build.GoVersion,
	Compiler:      build.Compiler,
	ModuleSum:     build.ModuleSum,
	Platform:      build.Platform,
	SystemPackage: build.SystemPackage,
	Dev:           build.Dev,
}
