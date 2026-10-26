SHELL := bash
TASK := ./scripts/task.sh

.PHONY: init install-tools install-wails install-nfpm dev dev-xdg build-frontend build-windows build-macos build-linux all package-deb package-rpm package-pacman package-linux clean help

all:
	@bash $(TASK) all

help:
	@bash $(TASK) help make

init:
	@bash $(TASK) init

install-tools:
	@bash $(TASK) install-tools $(TOOLS)

install-wails:
	@bash $(TASK) install-tools wails

install-nfpm:
	@bash $(TASK) install-tools nfpm

dev:
	@bash $(TASK) dev

dev-xdg:
	@bash $(TASK) dev-xdg

build-frontend:
	@bash $(TASK) build-frontend

build-windows:
	@bash $(TASK) build-windows

build-macos:
	@bash $(TASK) build-macos

build-linux:
	@bash $(TASK) build-linux

package-deb:
	@bash $(TASK) package-deb

package-rpm:
	@bash $(TASK) package-rpm

package-pacman:
	@bash $(TASK) package-pacman

package-linux:
	@bash $(TASK) package-linux

clean:
	@bash $(TASK) clean
