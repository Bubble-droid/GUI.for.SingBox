# Fork maintenance

This repository tracks `GUI-for-Cores/GUI.for.SingBox` and carries a small set
of intentional fork changes. The goal is to keep the diff against upstream
small so `git rebase upstream/main` stays cheap.

## Syncing with upstream

```bash
git fetch upstream
git rebase upstream/main
```

Enable rerere once so resolved conflicts are replayed automatically:

```bash
git config --global rerere.enabled true
```

## Fork-only files

Prefer new files over edits to upstream files. These are fork-owned and never
conflict:

- `internal/appinfo`, `internal/apppaths`, `internal/buildinfo`, `internal/cli`,
  `internal/fork`, `internal/signals`
- `bridge/uri_ext.go`, `bridge/uri_ext_test.go`
- `frontend/eslint/`, `frontend/src/features/`
- `Makefile`, `nfpm.yaml`, `packaging/`, `scripts/`
- `docs/fork/`

## Generated and lock files

- `frontend/pnpm-lock.yaml` is intentionally kept identical to upstream. Do not
  hand-merge it:
  `git checkout --theirs frontend/pnpm-lock.yaml && pnpm --dir frontend install --lockfile-only`
- `frontend/src/bridge/wailsjs/**` is generated. Regenerate with
  `wails generate module` instead of editing.

## CI

`.github/workflows/build.yml` is fork-only and gated on
`github.repository == 'Bubble-droid/GUI.for.SingBox'`. Upstream's
`.github/workflows/release.yml` is left untouched; disable it in the fork's
Actions settings so fork tags are only built once.

`alpha-release.yml` needs one manually pushed `vX.Y.Z-alpha.1` tag to
bootstrap.

## Path mapping

With XDG enabled (`internal/apppaths`), relative paths resolve as follows:

| Path                    | Location                     |
| ----------------------- | ---------------------------- |
| `data/<file>.yaml`      | `$XDG_CONFIG_HOME/<app-id>`  |
| `data/.cache/**`        | `$XDG_CACHE_HOME/<app-id>`   |
| everything else         | `$XDG_DATA_HOME/<app-id>`    |

`make dev` builds with the `non_xdg` tag; `make dev-xdg` uses XDG paths.
