## Preview

Take a look at the live version here: 👉 <a href="https://gui-for-cores.github.io/guide/gfs/" target="_blank">Live Demo</a>

<div align="center">
  <img src="docs/imgs/light.png">
</div>

## Additional features

This fork introduces the following enhancements:

- Enhanced Linux desktop user experience
- Native package support for Arch Linux
- XDG Base Directory Specification compliance for application data

## Document

[Community](https://gui-for-cores.github.io/guide/gfs/community)

## Build

1. Build Environment

```bash
sudo pacman -S nodejs pnpm go

export GOPATH="$XDG_DATA_HOME/go"
export PATH="$GOPATH/bin:$PATH"

go install github.com/wailsapp/wails/v2/cmd/wails@latest
# or paru -S wails
```

2. Pull and Build

```bash
git clone https://github.com/Bubble-droid/GUI.for.SingBox.git

cd GUI.for.SingBox/frontend

pnpm install --frozen-lockfile
pnpm build

cd ..

wails build -s -devtools -tags webkit2_41
```
