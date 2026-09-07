#!/usr/bin/env bash

# Application metadata
APP_ID="gui-for-singbox"
GO_MODULE="guiforcores"

# Paths
BIN_DIR="build/bin"
CORES_DIR="package/cores"
TMP_DIR="package/tmp"
PKGS_DIR="package/dist"

# Sing-box core versions
STABLE_VER="1.14.0"
ALPHA_VER="1.15.0-alpha.1"
BUNDLE_SUFFIX="_with_sing-box_v${STABLE_VER}_alpha_v${ALPHA_VER}"

# Build flags
WAILS_FLAGS=(-m -s -trimpath -skipbindings -devtools)

# Package descriptions
DESC_VANILLA="A GUI client application for sing-box (vanilla)"
DESC_FULL="A GUI client application for sing-box (with bundled cores)"

DEB_SUGGESTS="

Suggested Dependencies:
  * pkexec: Interactive authorization for privileged operations
  * libcap2-bin: Grant network capabilities to core binaries
  * libkf6config-bin: Configure KDE system proxy
  * libglib2.0-bin: Configure GNOME system proxy
  * network-manager: Automatically configure system DNS"

RPM_SUGGESTS="

Suggested Dependencies:
  * polkit: Interactive authorization for privileged operations
  * libcap: Grant network capabilities to core binaries
  * kf6-kconfig: Configure KDE system proxy
  * glib2: Configure GNOME system proxy
  * NetworkManager: Automatically configure system DNS"

DESC_VANILLA_DEB="${DESC_VANILLA}${DEB_SUGGESTS}"
DESC_VANILLA_RPM="${DESC_VANILLA}${RPM_SUGGESTS}"
DESC_VANILLA_ARCH="${DESC_VANILLA}"

DESC_FULL_DEB="${DESC_FULL}${DEB_SUGGESTS}"
DESC_FULL_RPM="${DESC_FULL}${RPM_SUGGESTS}"
DESC_FULL_ARCH="${DESC_FULL}"
