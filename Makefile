APP_NAME := gui-for-singbox
GO_MODULE := guiforcores
ARCH ?= amd64

APP_VERSION ?= $(shell git describe --tags --always 2>/dev/null || echo "dev")
TAR_VERSION := $(shell echo "$(APP_VERSION)" | sed 's/^v//')
PKG_VERSION := $(shell echo "$(APP_VERSION)" | sed 's/^v//; s/-//g')

BIN_OUTPUT_DIR := build/bin
FPM_DIR := packaging/fpm
CORES_DIR := packaging/cores
TEMP_DIR := packaging/temp
PKGS_DIR := packaging/pkgs

WAILS_FLAGS = -m -s -trimpath -skipbindings -devtools \
	-ldflags "-X '$(GO_MODULE)/bridge.AppVersion=$(APP_VERSION)' \
  	-X '$(GO_MODULE)/bridge.SingBoxVersion=$(STABLE_VER)' \
  	-X '$(GO_MODULE)/bridge.SingBoxAlphaVersion=$(ALPHA_VER)'"

ifeq ($(OS),Windows_NT)
RM_RF = powershell -NoProfile -Command "Remove-Item -Recurse -Force '$(BIN_OUTPUT_DIR)', '$(CORES_DIR)' -ErrorAction SilentlyContinue"
else
RM_RF = rm -rf $(BIN_OUTPUT_DIR) $(CORES_DIR) $(TEMP_DIR) $(PKGS_DIR) .fpm
endif

.PHONY: all build-frontend build-windows build-macos build-linux fetch-cores package-linux clean clean-cores

all: build-frontend build-linux

build-frontend:
	pnpm --dir frontend install --frozen-lockfile
	VITE_APP_VERSION=$(APP_VERSION) pnpm --dir frontend build-only

build-windows:
	@echo "==> Building Windows binary ($(ARCH))..."
	GOOS=windows GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -o $(APP_NAME).exe
	@cd $(BIN_OUTPUT_DIR) && zip -q $(APP_NAME)-$(TAR_VERSION)-windows-$(ARCH).zip $(APP_NAME).exe

patch-macos:
	@echo "==> Patching Wails AppDelegate for macOS Accessory Policy..."
	@go mod vendor
	@sed -i "" "s/\[NSApp setActivationPolicy:NSApplicationActivationPolicyRegular\]/[NSApp setActivationPolicy:NSApplicationActivationPolicyAccessory]/g" vendor/github.com/wailsapp/wails/v2/internal/frontend/desktop/darwin/AppDelegate.m

build-macos: patch-macos
	@echo "==> Building macOS binary ($(ARCH))..."
	GOOS=darwin GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -o $(APP_NAME)
	@cd $(BIN_OUTPUT_DIR) && tar -czvf $(APP_NAME)-$(TAR_VERSION)-darwin-$(ARCH).tar.gz $(APP_NAME).app

build-linux: fetch-cores
	@echo "==> Building Linux binary ($(ARCH))..."
	GOOS=linux GOARCH=$(ARCH) wails build $(WAILS_FLAGS) -tags webkit2_41 -o $(APP_NAME)
	@cd $(BIN_OUTPUT_DIR) && tar -czvf $(APP_NAME)-$(TAR_VERSION)-linux-$(ARCH).tar.gz $(APP_NAME)

fetch-cores:
	@mkdir -p $(CORES_DIR) $(TEMP_DIR)
	$(eval STABLE_VER := $(shell gh release list --repo SagerNet/sing-box --exclude-pre-releases --json tagName,isLatest --jq '.[] | select(.isLatest == true) | .tagName' | head -n 1 | sed 's/^v//'))
	$(eval ALPHA_VER := $(shell gh release list --repo SagerNet/sing-box --json tagName,isPrerelease --jq '.[] | select(.isPrerelease == true) | .tagName' | head -n 1 | sed 's/^v//'))
	@if [ -f "$(CORES_DIR)/sing-box" ] && [ -f "$(CORES_DIR)/sing-box-alpha" ]; then \
		echo "==> Cores already downloaded, skipping fetch."; \
	else \
		echo "==> Fetching Sing-Box Cores (Stable: v$(STABLE_VER), Alpha: v$(ALPHA_VER)) for $(ARCH)..."; \
		wget -qO $(TEMP_DIR)/stable.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(STABLE_VER)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc.tar.gz"; \
		tar -xzf $(TEMP_DIR)/stable.tar.gz -C $(TEMP_DIR); \
		cp $(TEMP_DIR)/sing-box-$(STABLE_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box; \
		wget -qO $(TEMP_DIR)/alpha.tar.gz "https://github.com/SagerNet/sing-box/releases/download/v$(ALPHA_VER)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc.tar.gz"; \
		tar -xzf $(TEMP_DIR)/alpha.tar.gz -C $(TEMP_DIR); \
		cp $(TEMP_DIR)/sing-box-$(ALPHA_VER)-linux-$(ARCH)-glibc/sing-box $(CORES_DIR)/sing-box-alpha; \
		chmod +x $(CORES_DIR)/*; \
		rm -rf $(TEMP_DIR)/*; \
	fi

package-linux: fetch-cores build-linux
	@mkdir -p $(PKGS_DIR)
	@echo "==> Packaging Linux (.deb, .rpm, .pkg.tar.zst) for $(ARCH)..."
	$(eval DEB_ARCH := $(shell if [ "$(ARCH)" = "amd64" ]; then echo "amd64"; elif [ "$(ARCH)" = "arm64" ]; then echo "arm64"; else echo "$(ARCH)"; fi))
	$(eval RPM_ARCH := $(shell if [ "$(ARCH)" = "amd64" ]; then echo "x86_64"; elif [ "$(ARCH)" = "arm64" ]; then echo "aarch64"; else echo "$(ARCH)"; fi))

	@cp $(FPM_DIR)/.fpm_systemd .fpm
	fpm -t deb -a "$(DEB_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(DEB_ARCH).deb"
	fpm -t rpm -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH).rpm"
	@cp $(FPM_DIR)/.fpm_pacman .fpm
	fpm -t pacman -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH).pkg.tar.zst"

	$(eval BUNDLE_SUFFIX := _with_sing-box_v$(STABLE_VER)_alpha_v$(ALPHA_VER))
	@cp $(FPM_DIR)/.fpm_systemd_full .fpm
	fpm -t deb -a "$(DEB_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(DEB_ARCH)$(BUNDLE_SUFFIX).deb"
	fpm -t rpm -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).rpm"
	@cp $(FPM_DIR)/.fpm_pacman_full .fpm
	fpm -t pacman -a "$(RPM_ARCH)" -v "$(PKG_VERSION)" -p "$(PKGS_DIR)/$(APP_NAME)_$(TAR_VERSION)_linux_$(RPM_ARCH)$(BUNDLE_SUFFIX).pkg.tar.zst"

	@rm -f .fpm

clean:
	$(RM_RF)

clean-cores:
	rm -rf $(CORES_DIR)/*
