//go:build !linux

package icon

import _ "embed"

//go:embed assets/favicon.ico
var AppIcon []byte
