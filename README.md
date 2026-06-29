<div align="right">
  <strong>English</strong> | <a href="./README_zh.md">简体中文</a>
</div>

# GUI for SingBox (Patch Fork)

> **About This Fork:** This is a functional patch branch that extends the official version with additional features and enhancements.

⚠️ **Important Note:** Please **DO NOT** report any issues encountered while using this branch to the upstream repository.

## ✨ Enhancements & Features

This fork introduces the following key enhancements:

- **Extended Configuration Options:** Introduces more configuration fields overall, alongside newly added Linux-exclusive fields.
- **Alpha Core Tracking:** Actively adapts to the features of the `alpha` core. _Note: We no longer provide extra compatibility for the `stable` core unless the alpha version is officially released as stable._
- **Enhanced Linux Desktop Integration:** Provides a better Linux desktop user experience.
- **Arch Linux Support:** Native package support for Arch Linux.
- **XDG Base Directory Compliance:** Strict adherence to XDG standards for application data reading and writing on Linux.

## 🧩 Plugin Compatibility

**Note:** This branch remains compatible with most official plugins. However, **plugins that require manipulating configurations are no longer supported**. Additionally, some backup-related plugins may not function properly on Linux platforms.

## 🔄 Migration Guide

**Warning:** It is highly recommended to back up your application data before migrating from the official version to this fork.

### 1. Profiles Migration

Because the underlying configuration structure has been refactored, migrating your profiles requires a few extra steps:

1. In the official client: Right-click your profile card -> **More** -> **Generate config to clipboard**.
2. In this fork's client: **Add a new default profile**.
3. Right-click the newly created profile card -> **More** -> **Edit config (Source)**.
4. Paste the copied configuration and save.

### 2. Linux App Data Migration (XDG Compliance)

Since this branch strictly complies with the XDG Base Directory Specification, please manually migrate your existing application data to the specified directories as shown below:

```bash
$XDG_CONFIG_HOME/gui-for-singbox
├── plugins.yaml
├── profiles.yaml
├── rulesets.yaml
├── scheduledtasks.yaml
├── subscribes.yaml
└── user.yaml

$XDG_CACHE_HOME/gui-for-singbox
├── icons
├── plugin-list.json
├── ruleset-list.json
└── sing-box
    ├── config.json
    ├── pid.txt
    ├── sing-box
    ├── sing-box-latest
    └── sing-box.log

$XDG_DATA_HOME/gui-for-singbox
├── locales
├── plugins
├── rulesets
├── subscribes
└── third
```

## 👁️ Preview

<div align="center">
  <img src="docs/imgs/light.png" alt="Preview">
</div>

## 📚 Document

[Community](https://gui-for-cores.github.io/guide/gfs/community)

## 🛠️ Build

### 1. Build Environment

- **Node.js** (>= 18) & **pnpm**: `npm i -g pnpm`
- **Go** (>= 1.21) [Download](https://go.dev/)
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **(Optional for Linux packaging)**: `ruby`, `fpm` (`gem install fpm`), `rpm`, `bsdtar`, `github-cli`

<details>
<summary><b>Arch Linux Quick Setup</b></summary>

```bash
sudo pacman -S nodejs pnpm go ruby rpm-tools webkit2gtk-4.1
export GOPATH="$XDG_DATA_HOME/go"
export PATH="$GOPATH/bin:$XDG_DATA_HOME/gem/ruby/x.x.x/bin:$PATH"

go install github.com/wailsapp/wails/v2/cmd/wails@latest
# or paru -S wails
gem install fpm
```

</details>

---

### 2. Clone Repository

```bash
git clone https://github.com/Bubble-droid/GUI.for.SingBox.git
cd GUI.for.SingBox
```

---

### 3. Build with Makefile (Recommended)

Using `make` is recommended. It automatically handles frontend compilation, dependency injection, cross-platform building, and Linux packaging:

```bash
# One-step build: Install frontend deps -> Build frontend -> Compile Linux GUI binary
make

# ----------------------------------------------------
# Step-by-step Makefile Targets
# ----------------------------------------------------
make build-frontend   # Build frontend assets only (frontend/dist)
make build-linux      # Build Linux GUI binary & tar.gz (with WebKitGTK tags)
make build-windows    # Build Windows executable & .zip archive
make build-macos      # Build macOS .app & tar.gz (applies Accessory patch automatically)

# Package Linux distributions (.deb, .rpm, .pkg.tar.zst)
# Generates both standalone GUI packages and bundled core packages
make package-linux ARCH=amd64

# Clean build artifacts and temporary files
make clean
```

---

### 4. Manual Build (Without Makefile)

If you prefer not to use `make`, you can build manually via CLI:

```bash
# 1. Build frontend
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend build-only

# 2. Build Linux GUI application
wails build -m -s -trimpath -skipbindings -devtools -tags webkit2_41
```
