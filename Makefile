SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.ONESHELL:

APP_NAME := gui-for-singbox
GO_MODULE := guiforcores
GOOS := $(shell go env GOOS)
ARCH ?= amd64

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

BIN_OUTPUT_DIR := build/bin
CORES_DIR := package/cores
TEMP_DIR := package/temp
FPM_DIR := package/fpm
PKGS_DIR := package/dist

_STABLE_VER_RAW = $(shell gh release list --repo SagerNet/sing-box --exclude-pre-releases --json tagName,isLatest --jq '.[] | select(.isLatest == true) | .tagName' 2>/dev/null | head -n 1 | sed 's/^v//')
STABLE_VER = $(eval STABLE_VER := $(or $(_STABLE_VER_RAW),1.13.0))$(STABLE_VER)

_ALPHA_VER_RAW = $(shell gh release list --repo SagerNet/sing-box --json tagName,isPrerelease --jq '.[] | select(.isPrerelease == true) | .tagName' 2>/dev/null | head -n 1 | sed 's/^v//')
ALPHA_VER = $(eval ALPHA_VER := $(or $(_ALPHA_VER_RAW),1.14.0-alpha.1))$(ALPHA_VER)

BUNDLE_SUFFIX = _with_sing-box_v$(STABLE_VER)_alpha_v$(ALPHA_VER)

_APP_VERSION_RAW = $(shell git describe --tags --always 2>/dev/null || echo "v0.0.0-dev")
APP_VERSION = $(eval APP_VERSION := $(_APP_VERSION_RAW))$(APP_VERSION)

TAR_VERSION = $(patsubst v%,%,$(APP_VERSION))
PKG_VERSION = $(subst -,~,$(TAR_VERSION))

DEB_ARCH = $(ARCH)
RPM_ARCH = $(if $(filter amd64,$(ARCH)),x86_64,$(if $(filter arm64,$(ARCH)),aarch64,$(ARCH)))

DEB_OPTS = $(shell cat $(FPM_DIR)/.fpm_systemd)
DEB_OPTS_FULL = $(shell cat $(FPM_DIR)/.fpm_systemd_full)
PACMAN_OPTS = $(shell cat $(FPM_DIR)/.fpm_pacman)
PACMAN_OPTS_FULL = $(shell cat $(FPM_DIR)/.fpm_pacman_full)
RPM_OPTS = $(shell cat $(FPM_DIR)/.fpm_rpm)
RPM_OPTS_FULL = $(shell cat $(FPM_DIR)/.fpm_rpm_full)

LDFLAGS_BASE = -X '$(GO_MODULE)/bridge.AppVersion=$(APP_VERSION)'
LDFLAGS_LINUX = $(LDFLAGS_BASE) \
	-X '$(GO_MODULE)/bridge.SingBoxVersion=$(STABLE_VER)' \
	-X '$(GO_MODULE)/bridge.SingBoxAlphaVersion=$(ALPHA_VER)'

WAILS_FLAGS = -m -s -trimpath -skipbindings -devtools

.PHONY: all dev dev-xdg \
 	patch-macos fetch-cores \
	build-frontend \
	build-windows build-macos build-linux \
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
	cd $(BIN_OUTPUT_DIR) && \
		if command -v zip >/dev/null 2>&1; then \
			zip -9 -q $(APP_NAME)-$(TAR_VERSION)-windows-$(ARCH).zip $(APP_NAME).exe ; \
		else \
			powershell -Command "Compress-Archive -Path '$(APP_NAME).exe' -DestinationPath '$(APP_NAME)-$(TAR_VERSION)-windows-$(ARCH).zip' -Force" ; \
		fi

patch-macos:
	echo "==> Patching Wails AppDelegate for macOS Accessory Policy..."
	go mod vendor
	sed -i.bak "s/\[NSApp setActivationPolicy:NSApplicationActivationPolicyRegular\]/[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]/g" vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m
	rm -f vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m.bak

build-macos: patch-macos
	echo "==> Building macOS binary ($(ARCH))..."
	GOFLAGS="-mod=vendor" GOOS=darwin GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -ldflags "$(LDFLAGS_BASE)" -o $(APP_NAME)
	cd $(BIN_OUTPUT_DIR) && mv GUI.for.SingBox.app $(APP_NAME).app && \
		tar -czvf $(APP_NAME)-$(TAR_VERSION)-darwin-$(ARCH).tar.gz $(APP_NAME).app

build-linux:
	echo "==> Building Linux binary ($(ARCH))..."
	GOOS=linux GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -ldflags "$(LDFLAGS_LINUX)" -tags webkit2_41 -o $(APP_NAME)
	cd $(BIN_OUTPUT_DIR) && tar -czvf $(APP_NAME)-$(TAR_VERSION)-linux-$(ARCH).tar.gz $(APP_NAME)

fetch-cores:
	mkdir -p $(CORES_DIR) $(TEMP_DIR)
	if [ -f "$(CORES_DIR)/sing-box" ] && [ -f "$(CORES_DIR)/sing-box-alpha" ]; then
		echo "==> Cores already downloaded, skipping fetch."
	else
		echo "==> Fetching Sing-Box Cores (Stable: v$(STABLE_VER), Alpha: v$(ALPHA_VER)) for $(ARCH)..."
		curl -fsSL -o $(TEMP_DIR)/stable.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(STABLE_VER)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc.tar.gz"
		tar -xzf $(TEMP_DIR)/stable.tar.gz -C $(TEMP_DIR)
		cp $(TEMP_DIR)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box

		curl -fsSL -o $(TEMP_DIR)/alpha.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(ALPHA_VER)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc.tar.gz"
		tar -xzf $(TEMP_DIR)/alpha.tar.gz -C $(TEMP_DIR)
		cp $(TEMP_DIR)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box-alpha

		chmod +x $(CORES_DIR)/*
		rm -rf $(TEMP_DIR)/*
	fi

.PHONY: check-binary \
	package-deb package-rpm package-pacman \
	package-deb-full package-rpm-full package-pacman-full \
	package-deb-all package-rpm-all package-pacman-all \
	package-standard package-full package-linux

check-binary:
	if [ ! -f "$(BIN_OUTPUT_DIR)/$(APP_NAME)" ]; then
		echo "==> Error: Linux binary '$(BIN_OUTPUT_DIR)/$(APP_NAME)' not found. Please run 'make build-linux' first." >&2
		exit 1
	fi

package-deb: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Debian (.deb) for $(ARCH)..."
	FPMOPTS='$(DEB_OPTS)' fpm -t deb -a "$(DEB_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(DEB_ARCH).deb"

package-rpm: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging RPM (.rpm) for $(ARCH)..."
	FPMOPTS='$(RPM_OPTS)' fpm -t rpm -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH).rpm"

package-pacman: check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Pacman (.pkg.tar.zst) for $(ARCH)..."
	FPMOPTS='$(PACMAN_OPTS)' fpm -t pacman -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH).pkg.tar.zst"

package-deb-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Debian Full (.deb) for $(ARCH)..."
	FPMOPTS='$(DEB_OPTS_FULL)' fpm -t deb -a "$(DEB_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(DEB_ARCH)$(BUNDLE_SUFFIX).deb"

package-rpm-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging RPM Full (.rpm) for $(ARCH)..."
	FPMOPTS='$(RPM_OPTS_FULL)' fpm -t rpm -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).rpm"

package-pacman-full: fetch-cores check-binary
	mkdir -p $(PKGS_DIR)
	echo "==> Packaging Pacman Full (.pkg.tar.zst) for $(ARCH)..."
	FPMOPTS='$(PACMAN_OPTS_FULL)' fpm -t pacman -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).pkg.tar.zst"

package-deb-all: package-deb package-deb-full
package-rpm-all: package-rpm package-rpm-full
package-pacman-all: package-pacman package-pacman-full

package-standard: package-deb package-rpm package-pacman
package-full: package-deb-full package-rpm-full package-pacman-full

package-linux: package-standard package-full

clean:
	rm -rf $(BIN_OUTPUT_DIR)/$(APP_NAME)* $(CORES_DIR) $(TEMP_DIR) $(PKGS_DIR)

clean-cores:
	rm -rf $(CORES_DIR)/*
