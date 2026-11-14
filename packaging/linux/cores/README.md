# Bundled sing-box cores

The Linux packages ship two sing-box releases:

- `stable` is installed as `/usr/lib/gui-for-singbox/cores/sing-box`.
- `alpha` is installed as `/usr/lib/gui-for-singbox/cores/sing-box-alpha`.

`cores.txt` is the single source of truth for the bundled versions and their
archive SHA-256 checksums. It contains two kinds of rows:

```text
<channel> <version>
<channel> <release-arch> <sha256>
```

The checksum rows are keyed by channel and release architecture (`amd64`,
`arm64`, `armv7`), so they do not repeat the version. `scripts/task.sh`
downloads the archives to `dist/cores/.cache`, verifies the checksums (retrying
up to three times), and extracts the binaries to `dist/cores` before packaging.
The upstream license is extracted alongside each binary as
`dist/cores/<core>.LICENSE`; the stable one is shipped as
`/usr/share/licenses/gui-for-singbox/sing-box/LICENSE`.

When bumping a channel, update its version row and the matching checksum rows in
`cores.txt`. The release assets are published at
`https://github.com/SagerNet/sing-box/releases`.
