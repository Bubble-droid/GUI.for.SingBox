SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.ONESHELL:

APP_NAME := gui-for-singbox
GO_MODULE := guiforcores
GOOS := $(shell go env GOOS)

ARCH ?= $(shell go env GOARCH)
APP_VERSION ?= $(shell git describe --tags --always 2>/dev/null || echo "v0.0.0-dev")

GIT_USER := $(shell git config user.name 2>/dev/null)
GIT_EMAIL := $(shell git config user.email 2>/dev/null)
DEFAULT_PACKAGER := $(if $(GIT_USER),$(GIT_USER) <$(GIT_EMAIL)>,Unknown Packager <user@example.com>)
PACKAGER ?= $(DEFAULT_PACKAGER)

ifeq ($(GOOS),windows)
NATIVE_BUILD_TARGET := build-windows
DEV_TAGS :=
DEV_PRE_REQ :=
DEV_ENV :=
else ifeq ($(GOOS),darwin)
NATIVE_BUILD_TARGET := build-macos
DEV_TAGS :=
DEV_PRE_REQ := patch-macos
DEV_ENV := GOFLAGS="-mod=vendor"
else
NATIVE_BUILD_TARGET := build-linux
DEV_TAGS := webkit2_41
DEV_PRE_REQ :=
DEV_ENV :=
endif

BIN_DIR := build/bin
CORES_DIR := package/cores
TMP_DIR := package/tmp
PKGS_DIR := package/dist

_STABLE_VER_RAW = $(shell gh release list --repo SagerNet/sing-box --exclude-pre-releases --json tagName,isLatest --jq '.[] | select(.isLatest == true) | .tagName' 2>/dev/null | head -n 1 | sed 's/^v//')
STABLE_VER = $(eval STABLE_VER := $(or $(_STABLE_VER_RAW),1.13.0))$(STABLE_VER)

_ALPHA_VER_RAW = $(shell gh release list --repo SagerNet/sing-box --json tagName,isPrerelease --jq '.[] | select(.isPrerelease == true) | .tagName' 2>/dev/null | head -n 1 | sed 's/^v//')
ALPHA_VER = $(eval ALPHA_VER := $(or $(_ALPHA_VER_RAW),1.14.0-beta.1))$(ALPHA_VER)

BUNDLE_SUFFIX = _with_sing-box_v$(STABLE_VER)_alpha_v$(ALPHA_VER)

ARCHIVE_VERSION = $(patsubst v%,%,$(APP_VERSION))
PKG_VERSION = $(subst -,~,$(ARCHIVE_VERSION))

DEB_ARCH = $(ARCH)
RPM_ARCH = $(if $(filter amd64,$(ARCH)),x86_64,$(if $(filter arm64,$(ARCH)),aarch64,$(ARCH)))

LDFLAGS_BASE = -X '$(GO_MODULE)/bridge.AppVersion=$(APP_VERSION)'
LDFLAGS_LINUX = $(LDFLAGS_BASE) \
	-X '$(GO_MODULE)/bridge.SingBoxVersion=$(STABLE_VER)' \
	-X '$(GO_MODULE)/bridge.SingBoxAlphaVersion=$(ALPHA_VER)'

WAILS_FLAGS = -m -s -trimpath -skipbindings -devtools

.PHONY: all dev dev-xdg patch-macos \
	build-frontend build-windows build-macos build-linux \
	clean clean-cores

all: build-frontend $(NATIVE_BUILD_TARGET)

dev: $(DEV_PRE_REQ)
	echo "==> Starting Wails dev mode (Version: dev)..."
	$(DEV_ENV) VITE_APP_VERSION=dev wails dev -tags "$(DEV_TAGS) non_xdg" -ldflags "-X '$(GO_MODULE)/bridge.AppVersion=dev'"

dev-xdg: $(DEV_PRE_REQ)
	echo "==> Starting Wails dev mode with XDG (Version: $(APP_VERSION))..."
	$(DEV_ENV) VITE_APP_VERSION=$(APP_VERSION) wails dev -tags "$(DEV_TAGS)" -ldflags "$(LDFLAGS_BASE)"

build-frontend:
	pnpm --dir frontend install --frozen-lockfile
	VITE_APP_VERSION=$(APP_VERSION) pnpm --dir frontend build-only

build-windows:
	echo "==> Building Windows binary ($(ARCH))..."
	GOOS=windows GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -ldflags "$(LDFLAGS_BASE)" -o $(APP_NAME).exe
	cd $(BIN_DIR) && powershell -Command "Compress-Archive -Path '$(APP_NAME).exe' -DestinationPath '$(APP_NAME)-$(ARCHIVE_VERSION)-windows-$(ARCH).zip' -Force"

patch-macos:
	echo "==> Patching Wails AppDelegate for macOS Accessory Policy..."
	go mod vendor
	sed -i.bak "s/\[NSApp setActivationPolicy:NSApplicationActivationPolicyRegular\]/[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]/g" vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m
	rm -f vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m.bak

build-macos: patch-macos
	echo "==> Building macOS binary ($(ARCH))..."
	GOFLAGS="-mod=vendor" GOOS=darwin GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -ldflags "$(LDFLAGS_BASE)" -o $(APP_NAME)
	cd $(BIN_DIR) && mv GUI.for.SingBox.app $(APP_NAME).app && \
		tar -czvf $(APP_NAME)-$(ARCHIVE_VERSION)-darwin-$(ARCH).tar.gz $(APP_NAME).app

build-linux:
	echo "==> Building Linux binary ($(ARCH))..."
	GOOS=linux GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -ldflags "$(LDFLAGS_LINUX)" -tags webkit2_41 -o $(APP_NAME)
	cd $(BIN_DIR) && tar -czvf $(APP_NAME)-$(ARCHIVE_VERSION)-linux-$(ARCH).tar.gz $(APP_NAME)

.PHONY: check-binary fetch-cores \
	package-deb package-rpm package-pacman \
	package-deb-full package-rpm-full package-pacman-full \
	package-deb-all package-rpm-all package-pacman-all \
	package-standard package-full package-linux

fetch-cores:
	mkdir -p $(CORES_DIR) $(TMP_DIR)
	if [ -f "$(CORES_DIR)/sing-box" ] && [ -f "$(CORES_DIR)/sing-box-alpha" ]; then
		echo "==> Cores already downloaded, skipping fetch."
	else
		echo "==> Fetching Sing-Box Cores (Stable: v$(STABLE_VER), Alpha: v$(ALPHA_VER)) for $(ARCH)..."
		curl -fsSL -o $(TMP_DIR)/stable.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(STABLE_VER)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc.tar.gz"
		tar -xzf $(TMP_DIR)/stable.tar.gz -C $(TMP_DIR)
		cp $(TMP_DIR)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box

		curl -fsSL -o $(TMP_DIR)/alpha.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(ALPHA_VER)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc.tar.gz"
		tar -xzf $(TMP_DIR)/alpha.tar.gz -C $(TMP_DIR)
		cp $(TMP_DIR)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box-alpha

		chmod +x $(CORES_DIR)/*
		rm -rf $(TMP_DIR)/*
	fi

check-binary:
	if [ ! -f "$(BIN_DIR)/$(APP_NAME)" ]; then
		echo "==> Error: Linux binary '$(BIN_DIR)/$(APP_NAME)' not found. Please run 'make build-linux' first." >&2
		exit 1
	fi

DESC_VANILLA := A GUI client application for sing-box (vanilla)
DESC_FULL    := A GUI client application for sing-box (with bundled cores)

define DEB_SUGGESTS

Suggested Dependencies:
  * pkexec: Interactive authorization for privileged operations
  * libcap2-bin: Grant network capabilities to core binaries
  * libkf6config-bin: Configure KDE system proxy
  * libglib2.0-bin: Configure GNOME system proxy
  * network-manager: Automatically configure system DNS
endef

define RPM_SUGGESTS

Suggested Dependencies:
  * polkit: Interactive authorization for privileged operations
  * libcap: Grant network capabilities to core binaries
  * kf6-kconfig: Configure KDE system proxy
  * glib2: Configure GNOME system proxy
  * NetworkManager: Automatically configure system DNS
endef

DESC_VANILLA_DEB  := $(DESC_VANILLA)$(DEB_SUGGESTS)
DESC_VANILLA_RPM  := $(DESC_VANILLA)$(RPM_SUGGESTS)
DESC_VANILLA_ARCH := $(DESC_VANILLA)

DESC_FULL_DEB     := $(DESC_FULL)$(DEB_SUGGESTS)
DESC_FULL_RPM     := $(DESC_FULL)$(RPM_SUGGESTS)
DESC_FULL_ARCH    := $(DESC_FULL)

package-deb: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Debian (.deb) for $(DEB_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_VANILLA_DEB)" ARCH="$(DEB_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm.yaml -p deb -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(DEB_ARCH).deb"

package-rpm: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging RPM (.rpm) for $(RPM_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_VANILLA_RPM)" ARCH="$(RPM_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm.yaml -p rpm -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(RPM_ARCH).rpm"

package-pacman: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Pacman (.pkg.tar.zst) for $(RPM_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_VANILLA_ARCH)" ARCH="$(RPM_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm.yaml -p archlinux -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(RPM_ARCH).pkg.tar.zst"

package-deb-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Debian Full (.deb) for $(DEB_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_FULL_DEB)" ARCH="$(DEB_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm-full.yaml -p deb -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(DEB_ARCH)$(BUNDLE_SUFFIX).deb"

package-rpm-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging RPM Full (.rpm) for $(RPM_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_FULL_RPM)" ARCH="$(RPM_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm-full.yaml -p rpm -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).rpm"

package-pacman-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Pacman Full (.pkg.tar.zst) for $(RPM_ARCH)..."
	PACKAGER="$(PACKAGER)" DESCRIPTION="$(DESC_FULL_ARCH)" ARCH="$(RPM_ARCH)" VERSION="$(PKG_VERSION)" \
		nfpm package -f nfpm-full.yaml -p archlinux -t "$(PKGS_DIR)/$(APP_NAME)_$(ARCHIVE_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).pkg.tar.zst"

package-deb-all: package-deb package-deb-full
package-rpm-all: package-rpm package-rpm-full
package-pacman-all: package-pacman package-pacman-full

package-standard: package-deb package-rpm package-pacman
package-full: package-deb-full package-rpm-full package-pacman-full

package-linux: package-standard package-full

clean:
	rm -rf $(BIN_DIR)/$(APP_NAME)* $(CORES_DIR) $(TMP_DIR) $(PKGS_DIR)

clean-cores:
	rm -rf $(CORES_DIR)/*
