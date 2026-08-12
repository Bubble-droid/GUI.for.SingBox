# AGENTS.md

GUI.for.SingBox — a desktop GUI client for [sing-box](https://sing-box.sagernet.org/), built with [Wails v2](https://wails.io/): Go backend + Vue 3 frontend compiled into one binary. The Go module is `guiforcores` (not the repo name).

## Skills

`.agents/skills/` holds skill files meant to be used, not browsed. Before acting on any user task, self-select and load the skill(s) relevant to the work at hand and apply them — proactive, autonomous skill use is expected; do not wait for the user to invoke one.

## Layout

- `main.go` — Wails entrypoint; embeds the built frontend via `//go:embed all:frontend/dist`.
- `bridge/` — Go backend package exposed to the frontend as Wails bindings. `bridge/platform/` holds per-OS code (`exec`, `lifecycle`, `path`, `proxy`).
- `frontend/` — Vue 3 + Vite 8 + TypeScript + Pinia + vue-router + vue-i18n + CodeMirror.
  - `frontend/src/bridge/` — handwritten TS wrappers plus `wailsjs/` **generated** bindings.
  - `frontend/src/views/` — top-level pages (`HomeView`, `ProfilesView`, `SettingsView`, …).
  - `frontend/src/features/views/` — config sub-views (`DnsConfig.vue`, `OutboundsConfig.vue`, …), aliased as `@views/*`.
  - `frontend/src/features/transformers/` — `generator` (config → sing-box JSON) and `restorer` (config → UI).
- `Makefile` — the real entrypoint for dev/build/packaging; `wails.json` and `wails build` alone are not enough.

## Commands

Run everything from the repo root.

```bash
make dev          # dev mode, non-XDG paths (uses -tags non_xdg, VITE_APP_VERSION=dev)
make dev-xdg      # dev mode with XDG data dirs and real version
make build-frontend  # pnpm install + vite build into frontend/dist
make build-linux     # needs frontend/dist first; cross builds use build-frontend upstream
```

Frontend-only checks (all in `frontend/`):

```bash
pnpm --dir frontend install --frozen-lockfile
pnpm --dir frontend type-check      # vue-tsc --build
pnpm --dir frontend lint            # oxlint + eslint, both auto-fix
pnpm --dir frontend format          # oxfmt
```

There are no test suites (no Go `_test.go`, no vitest). Verification is `type-check` + `lint` for frontend, `go build ./...` / `make build-<os>` for Go.

## Gotchas

- **Order matters**: `main.go` embeds `frontend/dist`, and `frontend/dist` is gitignored — the frontend must be built before any `wails build`. CI builds frontend as a separate job and downloads the artifact.
- **Generated bindings**: `frontend/src/bridge/wailsjs/` is committed and must not be hand-edited (oxlint ignores it). `wails build` runs with `-skipbindings`, so if you add/change Go methods on `App`, regenerate with `wails dev` or `wails generate module`. `wails.json` sets `wailsjsdir: frontend/src/bridge`.
- **Version injection**: `bridge.AppVersion`, `bridge.SingBoxVersion`, `bridge.SingBoxAlphaVersion` are vars set via `-ldflags "-X 'guiforcores/bridge.AppVersion=...'"`. `AppVersion == "dev"` flips the app into dev mode. Running the frontend alone won't reflect these.
- **TS path aliases** (from `tsconfig.app.json`): `@/`, `@features/*`, `@views/*`, `@profiles/*`, `@defaults/*`, `@generator/*`, `@restorer/*`, `@wails/*` (→ `src/bridge/wailsjs/*`). Vite uses `tsconfigPaths: true` so they work at build time too.
- **Strict TS**: `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `noPropertyAccessFromIndexSignature` are on — expect `.at()`/optional chaining and explicit property access.
- **No barrel files**: oxlint enforces `oxc/no-barrel-file` (threshold 1) and `import/no-cycle`; recent refactors removed index re-export files. Import directly from the defining module.
- **Formatting is oxfmt**, not Prettier (though prettier is a dep for eslint-config-prettier). `.editorconfig` + `oxfmt` define style; lint-staged runs oxlint + eslint + oxfmt on commit.
- **Linux**: builds/tests need `libgtk-3-dev libwebkit2gtk-4.1-dev` and the `webkit2_41` build tag (handled by `make`).
- **macOS**: `make` runs `patch-macos` first (go mod vendor + sed-patches Wails' `AppDelegate.m` to set `ActivationPolicyAccessory`) and builds with `-mod=vendor`.
- **sing-box cores are not in this repo**: `package/cores/` is gitignored. `make fetch-cores` downloads `sing-box`/`sing-box-alpha` from SagerNet/sing-box releases for the "full" packages; vanilla packages expect a system-installed core. `bridge.SingBoxVersion` is baked in at build time.
- **Packaging uses a nfpm fork**: install via `go install` from `https://github.com/Bubble-droid/nfpm` (`feat/arch` branch) for pacman support.
- A `replace` directive in `go.mod` swaps `github.com/energye/systray` for the GUI-for-Cores fork.

## Conventions

- Frontend code lives under `frontend/src/features/` for app-specific logic (types, defaults, transformers, i18n); keep generic utilities out of `features`.
- i18n strings live in `frontend/src/lang` / `features/i18n`; user-facing copy is not hardcoded in components.
