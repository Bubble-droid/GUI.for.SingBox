package config

const (
	baseAppTitle = "GUI.for.SingBox"
	baseAppID    = "gui-for-singbox"
)

var (
	appVersion          = "unknown"
	singBoxVersion      = "unknown"
	singBoxAlphaVersion = "unknown"
)

type AppInfo struct {
	AppTitle            string
	AppID               string
	AppVersion          string
	IsDev               bool
	SingBoxVersion      string
	SingBoxAlphaVersion string
}

var Info = AppInfo{
	AppTitle:            appTitle,
	AppID:               appID,
	AppVersion:          appVersion,
	IsDev:               isDev,
	SingBoxVersion:      singBoxVersion,
	SingBoxAlphaVersion: singBoxAlphaVersion,
}
