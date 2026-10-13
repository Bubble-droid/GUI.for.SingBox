package appinfo

const (
	baseTitle = "GUI.for.SingBox"
	baseID    = "gui-for-singbox"
)

type Metadata struct {
	IsDev bool
	Title string
	ID    string
}

var Current = Metadata{
	IsDev: isDev,
	Title: title,
	ID:    id,
}
