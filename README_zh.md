<div align="right">
  <a href="./README.md">English</a> | <strong>简体中文</strong>
</div>

# GUI for SingBox (修补分支)

> **关于本分支**：这是一个功能性修补分支，在官方版本的基础上扩展了更多功能与特性。

⚠️ **重要提示**：使用本分支版本遇到的任何问题，请**勿**向上游（官方）仓库报告。

## ✨ 核心特性与增强

本分支引入了以下主要增强功能：

- **更多扩展配置项**：扩展了更丰富的配置字段，并新增了 Linux 专属的配置项。
- **跟进 Alpha 核心**：积极适配 `alpha` 版核心的特性。_注意：本分支不再额外兼容 `stable` 版核心，除非当前的 alpha 版转为正式稳定版本。_
- **深度 Linux 桌面集成**：进一步增强 Linux 桌面用户的操作体验。
- **Arch Linux 支持**：提供 Arch Linux 原生软件包支持。
- **遵守 XDG 规范**：在 Linux 平台上的应用数据读写始终严格遵守 XDG 基本目录规范。

## 🧩 插件兼容性

**注意**：本分支仍兼容大部分官方插件，但**需要直接操作配置的插件将不再兼容**。此外，部分备份类插件在 Linux 平台上可能无法正常工作。

## 🔄 迁移指南

**警告**：从官方版本迁移到此分支版本前，强烈建议先备份您的应用数据。

### 1. 配置文件的迁移

由于已重构底层配置结构，配置的迁移需要按照以下额外步骤进行：

1. 在官方客户端中：右键点击配置卡片 -> **更多** -> **生成配置到剪切板**。
2. 打开本分支客户端：**添加新的默认配置**。
3. 右键点击新创建的配置卡片 -> **更多** -> **编辑配置（源文件）**。
4. 粘贴复制的配置内容并保存。

### 2. Linux 应用数据迁移 (XDG 规范)

由于本分支完全遵守 XDG 基本目录规范，请按照以下示例目录树，自行将原有的应用数据迁移到对应目录：

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

## 👁️ 预览

<div align="center">
  <img src="docs/imgs/light.png" alt="Preview">
</div>

## 📚 文档

[社区支持 (Community)](https://gui-for-cores.github.io/guide/gfs/community)

## 🛠️ 构建指南

### 1. 准备构建环境

- **Node.js** (>= 18) 与 **pnpm**: `npm i -g pnpm`
- **Go** (>= 1.21) [下载地址](https://go.dev/)
- **Wails CLI**: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- **(可选，仅打包 Linux 安装包需要)**: `ruby`, `fpm` (`gem install fpm`), `rpm`, `bsdtar`, `github-cli`

<details>
<summary><b>Arch Linux 一键配置环境</b></summary>

```bash
sudo pacman -S nodejs pnpm go ruby rpm-tools webkit2gtk-4.1
export GOPATH="$XDG_DATA_HOME/go"
export PATH="$GOPATH/bin:$PATH"

go install github.com/wailsapp/wails/v2/cmd/wails@latest
# 或者 paru -S wails
gem install fpm
```

</details>

---

### 2. 克隆仓库

```bash
git clone https://github.com/Bubble-droid/GUI.for.SingBox.git
cd GUI.for.SingBox
```

---

### 3. 使用 Makefile 构建 (推荐)

推荐直接使用 `make` 指令，它会自动处理前端构建、依赖注入、跨平台编译及 Linux 软件包封装：

```bash
# 一键完成：安装前端依赖 -> 构建前端 -> 编译 Linux GUI 可执行文件
make

# ----------------------------------------------------
# 常用分步构建目标 (Makefile Targets)
# ----------------------------------------------------
make build-frontend   # 仅构建前端代码 (frontend/dist)
make build-linux      # 编译 Linux GUI 二进制及 tar.gz (含 WebKitGTK 标记)
make build-windows    # 编译 Windows 可执行文件及 .zip 压缩包
make build-macos      # 编译 macOS .app 及 tar.gz (自动应用 Accessory 补丁)

# 打包 Linux 安装包 (.deb, .rpm, .pkg.tar.zst)
# 会同时生成【纯 GUI 独立包】与【内置 Sing-Box 核心捆绑包】
make package-linux ARCH=amd64

# 清理所有构建产物与临时文件
make clean
```

---

### 4. 手动构建 (不使用 Makefile)

如果你不需要使用 `make`，也可以通过传统 CLI 命令行手动构建：

```bash
# 1. 构建前端
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend build-only

# 2. 编译 Linux GUI 主程序
wails build -m -s -trimpath -skipbindings -devtools -tags webkit2_41
```
