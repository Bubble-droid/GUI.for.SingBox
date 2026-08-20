//go:build windows

package main

import _ "embed"

//go:embed frontend/dist/favicon.ico
var appIcon []byte
