# Linux 系统守护进程核心管理方案（规划稿）

- 状态：阶段 1-4 已实现，阶段 5 验收与文档维护中
- 目标分支：`feat/linux-daemon-integration`
- 使用说明：`docs/linux-daemon.md`
- 适用平台：Linux 系统包安装（`IsSystemPackage == true`）
- 非目标平台：Windows、macOS、Linux 便携包/解压运行

## 1. 结论摘要

系统包安装使用一套独立的守护进程方案：

```text
GUI（普通用户，gui-for-singbox 组成员）
   │  Unix domain socket + JSON-RPC
   ▼
gui-for-singbox-daemon（root，完整特权，受 systemd 沙箱约束）
   │  fork/exec，固定 argv、固定环境
   ▼
sing-box（root，完整特权，受同一 systemd 沙箱约束）
```

核心原则：

1. 不再使用 `sudo`、`sudoers`、`pkexec setcap` 或特权 helper 完成核心管理。
2. 守护进程不接收任意文件路径、任意命令、任意参数或任意环境变量。
3. 配置文件由守护进程写入固定目录；写入前执行 `sing-box check`，校验失败不替换旧配置。
4. 核心以 root 运行，与官方 `sing-box` 软件包一致，具备完整 TUN、nftables、透明代理、系统进程追踪能力。
5. 通过 systemd socket activation 按需启动守护进程，普通用户无需 `systemctl` 权限。
6. 系统包安装只使用守护进程方案；非系统包安装保持现有 `setcap` + `ExecBackground` 子进程方案，二者互不影响。
7. stable/alpha 切换由守护进程完成：选择不同核心路径，停止旧进程，启动新进程。
8. 系统包模式下核心文件不带 file capabilities，核心只能由守护进程以 root 启动。

说明：`gui-for-singbox` 组从此是特权组。组成员可通过守护进程以 root 启动核心，故不得自动把普通用户加入该组。

## 2. 当前工作区审查

### 2.1 已存在的未提交实现

当前分支 `feat/linux-daemon-integration` 上存在一套未提交的尝试：

- `bridge/daemon_linux.go`
- `cmd/helper/main.go`
- `cmd/helper.sh`
- `packaging/linux/gui-for-singbox-core.service`
- `packaging/linux/systemd/`（重复 unit 与 2.1 MiB 预编译 helper）
- `packaging/linux/gui-for-singbox.rules` 中的 `org.freedesktop.systemd1.manage-units` 规则
- `packaging/linux/scripts/postinstall.sh` 中的共享目录、helper、sudoers 逻辑

这些改动已从工作区移除，并以可恢复方式保存：

- stash：`wip: unsafe linux daemon attempt`
- 补丁备份：`/tmp/opencode/gui-singbox-daemon-wip/tracked.patch`
- 未跟踪文件备份：`/tmp/opencode/gui-singbox-daemon-wip/untracked.tar.gz`

### 2.2 必须丢弃的原因

`bridge/daemon_linux.go`：

- 直接调用 `systemctl`，没有可靠的权限模型，也没有定义自己的 systemd 管理策略。
- 构造 systemd D-Bus 对象路径的方式错误，unit 名中的 `.` 未按 D-Bus object path 规则转义，状态查询不可靠。
- `DaemonWriteConfig` 在 helper 不可用时回退为普通用户直接写共享目录，绕过了权限边界。
- helper 查找路径包含 `Env.BasePath`，与系统包和便携包语义混淆。
- 使用 `/run/sing-box.socket`、`/opt/sing-box/resources/daemon/sing-box-daemon` 等不属于本项目的路径。
- 没有配置校验、原子写入、协议、认证、并发控制、日志读取和 stable/alpha 切换。

`cmd/helper/main.go`、`cmd/helper.sh`：

- helper 接受任意目标路径并以 root 身份写入，等价于任意 root 文件覆盖。
- `--rm-dir` 接受任意路径并执行 `rm -rf`，等价于任意 root 目录删除。
- 通过 sudoers `NOPASSWD` 暴露一个通用提权工具，安全边界过大。

`postinstall.sh`：

- 为普通用户组配置 `NOPASSWD` sudoers，违反最小权限原则。
- 把共享目录设为 `root:gui-for-singbox 0750`，但应用仍试图直接写入，权限模型自相矛盾。
- 没有创建独立服务用户，没有 systemd preset/daemon-reload，没有卸载清理。

systemd unit：

- 以 root 运行本身符合官方包行为，但缺少沙箱、固定配置路径和生命周期管理。
- `Restart=always` 与固定 `ExecStart` 无法支持 stable/alpha 切换。
- `ProtectSystem=true` 与核心实际需要不匹配，且没有 `StateDirectory=`、`RuntimeDirectory=`。
- 没有 socket activation，也没有与 GUI 的通信端点。

polkit rules：

- 通过 `org.freedesktop.systemd1.manage-units` 允许组用户操作 unit，规则匹配字段不可靠，且与守护进程方案重复。
- 现有 DNS 相关 polkit 规则是既有功能，保留，不在本次移除范围。

### 2.3 可保留的既有基础

- `bridge.SystemPackage` 与 `Env.IsSystemPackage` 的判定逻辑。
- `packaging/linux/cores/cores.txt` 与 `scripts/task.sh` 的 stable/alpha 核心下载、校验逻辑。
- `nfpm.yaml` 中现有应用、核心、桌面文件、DNS polkit 规则和许可证打包逻辑。
- 系统代理与系统 DNS 的现有实现和 polkit 规则。
- 便携安装的 `setcap` + `ExecBackground` 路径。

## 3. 目标与非目标

### 3.1 目标

- 系统包安装下，核心由守护进程统一管理，GUI 不直接启动特权核心。
- 守护进程只暴露少量、固定语义的管理操作。
- 核心以 root 运行，与官方 `sing-box` 包一致，具备完整 nftables、TUN、透明代理和系统进程网络连接追踪能力。
- 核心 root 读取用户规则集、订阅、MMDB、TLS 文件等资源，不需要扩大用户目录权限。
- 支持 stable/alpha 核心切换，并在切换时正确停止旧进程、启动新进程。
- 支持核心崩溃检测、日志读取、缓存清理、开机恢复。
- 支持在连接列表显示系统进程路径，避免无法判断连接来源。
- 保持现有便携安装行为完全不变。
- 打包、升级、卸载行为可预测，状态目录不被升级破坏。
- 安全和权限模型可审计、可测试。

### 3.2 非目标

- 不把完整 sing-box `boxdd`/gRPC 功能引入本项目。
- 不实现多实例核心、多用户同时运行核心。
- 不通过守护进程代理系统代理、系统 DNS、TUN 权限授予等既有 GUI 功能。
- 不支持无 systemd 的系统包环境下的守护进程模式（应明确报错，不静默降级）。
- 不允许系统包模式下从 GUI 自行下载、替换核心二进制；核心由包管理器更新。

## 4. 总体架构

### 4.1 组件

| 组件 | 位置 | 身份 | 职责 |
| --- | --- | --- | --- |
| GUI | `/usr/lib/gui-for-singbox/gui-for-singbox` | 普通用户 | 生成配置、调用 socket、管理界面状态 |
| 守护进程 | `/usr/lib/gui-for-singbox/gui-for-singbox-daemon` | root，完整特权 | 配置校验/落盘、进程生命周期、日志、状态、stable/alpha 切换 |
| 核心 stable | `/usr/lib/gui-for-singbox/cores/sing-box` | root，完整特权 | 实际代理进程，nftables/TUN/进程追踪 |
| 核心 alpha | `/usr/lib/gui-for-singbox/cores/sing-box-alpha` | root，完整特权 | 实际代理进程，nftables/TUN/进程追踪 |
| systemd socket | `gui-for-singbox-daemon.socket` | root | 创建 socket、按需激活守护进程 |
| systemd service | `gui-for-singbox-daemon.service` | root | 运行守护进程与核心，施加文件系统/内核沙箱 |

### 4.2 为什么核心以 root 运行

官方 Linux 包的做法是核心以 root 运行：

- `dist/sing-box_1.15.0-alpha.13_linux_x86_64.pkg/usr/lib/systemd/system/sing-box.service` 没有 `User=`，`ExecStart=/usr/bin/sing-box -D /var/lib/sing-box -C /etc/sing-box run`。
- `dist/SFL-1.15.0-alpha.13-x64.pkg` 的 `sing-box-daemon.service` 同样以 root 运行，核心在守护进程内运行。
- 官方 `sing-box` 的进程搜索器扫描 `/proc` 下所有 UID，并通过 netlink `sock_diag` 查询 socket；非 root 会被 `/proc/<pid>/fd` 与跨用户 ptrace 权限限制。
- `auto_redirect`、`bridge` 的 nftables 规则、TUN 路由、透明代理都需要 root 或至少 `CAP_NET_ADMIN` 及相应能力。

因此本方案不再把核心降权到发起用户，而是：

- 守护进程以 root 运行，子进程也以 root 运行。
- 不设置 `SysProcAttr.Credential`，不设置 `AmbientCaps`。
- 核心拥有与官方包相同的完整特权，能使用 nftables、TUN、netns、进程追踪。
- 守护进程仍只接受固定语义请求，不接受任意命令、argv、路径或环境变量。
- 核心读取用户规则集时以 root 权限读取绝对路径，不要求放宽用户目录权限。
- 安全边界由 systemd 沙箱、固定配置路径、socket 认证和受信任组共同承担。

需要明确：守护进程若被攻破，等价于 root 被攻破；核心若被恶意配置攻破，也等价于 root 被攻破。这是“完整特权”方案的固有代价，官方包同样接受。`gui-for-singbox` 组必须按特权组管理。

### 4.3 为什么使用 socket activation

- 普通用户组只需连接 socket，无需 `systemctl start` 权限。
- 守护进程未运行时，首次连接由 systemd 自动拉起。
- 不需要额外 polkit 规则或 sudoers。
- socket 权限、属主和目录权限由 systemd unit 声明，便于审计。

## 5. 命名与目录规范

统一使用包名 `gui-for-singbox` 作为前缀，避免与官方 sing-box 的 `sing-box`、`sing-box-daemon` 命名冲突。

### 5.1 文件与 unit

| 类型 | 路径 |
| --- | --- |
| 应用主程序 | `/usr/lib/gui-for-singbox/gui-for-singbox` |
| 守护进程 | `/usr/lib/gui-for-singbox/gui-for-singbox-daemon` |
| stable 核心 | `/usr/lib/gui-for-singbox/cores/sing-box` |
| alpha 核心 | `/usr/lib/gui-for-singbox/cores/sing-box-alpha` |
| 启动 wrapper | `/usr/bin/gui-for-singbox` |
| socket unit | `/usr/lib/systemd/system/gui-for-singbox-daemon.socket` |
| service unit | `/usr/lib/systemd/system/gui-for-singbox-daemon.service` |
| sysusers 配置（可选） | `/usr/lib/sysusers.d/gui-for-singbox.conf` |
| DNS polkit 规则 | `/usr/share/polkit-1/rules.d/99-gui-for-singbox.rules` |

### 5.2 运行时与状态目录

| 用途 | 路径 | 权限 |
| --- | --- | --- |
| 守护进程状态根目录 | `/var/lib/gui-for-singbox` | `root:root 0755` |
| 守护进程状态文件 | `/var/lib/gui-for-singbox/state.json` | `root:root 0600` |
| 每用户会话目录 | `/var/lib/gui-for-singbox/users/<uid>` | `root:root 0700` |
| 当前配置 | `/var/lib/gui-for-singbox/users/<uid>/config.json` | `root:root 0600` |
| 当前缓存 | `/var/lib/gui-for-singbox/users/<uid>/cache.db` | `root:root 0600` |
| 核心日志 | `/var/lib/gui-for-singbox/users/<uid>/core.log` | `root:root 0600`，仅通过 API 读取 |
| socket 目录 | `/run/gui-for-singbox` | `root:gui-for-singbox 0750` |
| socket | `/run/gui-for-singbox/daemon.sock` | `root:gui-for-singbox 0660` |

说明：

- 不使用 `/etc/gui-for-singbox` 存放可变状态；配置由 GUI 生成，属于运行时状态。
- 不使用 `/var/lib/gui-for-singbox-data` 等临时命名。
- 每用户目录由 root 持有，普通用户不能直接改配置、缓存或日志；读取通过守护进程 API。
- `state.json` 只记录当前会话 UID、channel、期望运行状态和上次退出原因。
- 核心以 root 运行时仍使用每用户目录，目的是隔离会话状态与日志，而不是隔离 root 文件权限。

## 6. 身份、权限与安全模型

### 6.1 用户与组

- 系统组：`gui-for-singbox`，这是特权组。
- 守护进程以 root 运行，完整特权，受 systemd 文件系统/内核沙箱约束。
- 普通 GUI 用户必须加入 `gui-for-singbox` 组才能连接 socket。
- 组成员可通过守护进程以 root 启动核心，故只应加入受信任用户。
- 不自动把安装者加入组；安装脚本输出明确提示：
  `sudo usermod -aG gui-for-singbox <user>`，并提示重新登录。
- root 始终允许连接，便于救援和调试。

### 6.2 socket 认证

每个连接使用 `SO_PEERCRED` 获取对端凭据：

```go
ucred, err := unix.GetsockoptUcred(fd, unix.SOL_SOCKET, unix.SO_PEERCRED)
```

认证步骤：

1. 读取 `ucred.Uid`、`ucred.Gid`、`ucred.Pid`。
2. UID 为 0：直接允许。
3. 读取 `/proc/<pid>/status`，校验：
   - `Uid` 与 `ucred.Uid` 一致。
   - `Groups` 包含 `gui-for-singbox` 的 GID，或 `ucred.Gid` 等于该 GID。
4. 读取 `/proc/<pid>/stat` 的 start time，降低 PID 复用风险。
5. 解析失败、进程已退出、组不匹配：拒绝连接。
6. 可选：内核支持时优先使用 `SO_PEERPIDFD`，减少 `/proc` 竞态。

限制：

- 只监听 Unix domain socket，不监听 TCP。
- socket 模式 `0660`，目录 `0750`。
- 单连接请求大小上限，例如 16 MiB。
- 请求读取/写入超时，例如 30 秒。
- 并发连接数上限，例如 16。
- 协议中不出现任意路径、任意命令、任意 argv、任意环境变量。

### 6.3 权限模型：完整特权 + systemd 沙箱

核心需要与官方包相同的完整特权，因此不设置会截断能力的 `CapabilityBoundingSet=`，不设置 `AmbientCapabilities=`。若后续要收紧能力集，必须包含以下能力并逐项验证：

```text
CAP_NET_ADMIN        nftables、TUN、路由、透明代理
CAP_NET_RAW          raw socket
CAP_NET_BIND_SERVICE 低端口
CAP_SYS_PTRACE       /proc/<pid>/fd 与 exe 跨用户读取
CAP_DAC_READ_SEARCH  读取用户与系统资源
CAP_SYS_ADMIN        netns、mount 等可选功能
CAP_KILL             停止核心进程组
```

但默认建议保持完整能力，因为任意遗漏都会造成“官方包可用、本包不可用”的功能差异。安全检查放在文件系统与内核沙箱：

```ini
ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=no
ProtectProc=default
ProcSubset=all
ProtectKernelTunables=no
ProtectControlGroups=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
LockPersonality=yes
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6 AF_NETLINK AF_PACKET
ReadWritePaths=/var/lib/gui-for-singbox /run/gui-for-singbox
```

说明：

- `PrivateDevices=no`：核心需要 `/dev/net/tun`。
- `ProtectProc=default`：不能使用 `invisible`，否则无法扫描其他用户进程。
- `ProtectKernelTunables=no`：TUN、透明代理可能写 `/proc/sys/net`。
- 不设置 `PrivateNetwork`、`PrivateUsers`、`RestrictNamespaces`，避免破坏 netns 与透明代理功能。
- 若目标发行版要求 SELinux/AppArmor，另加策略，不用 capability 截断代替。

### 6.4 核心进程启动

核心启动参数固定，不接受 GUI 传入：

```text
/usr/lib/gui-for-singbox/cores/sing-box run --disable-color -c <config> -D <session-dir>
```

或 alpha 对应路径。

固定环境：

```text
HOME=/var/lib/gui-for-singbox
PATH=/usr/bin:/bin
TMPDIR=/run/gui-for-singbox
```

不继承 GUI 进程的完整环境，避免泄漏和注入。

`SysProcAttr` 关键字段：

```go
&syscall.SysProcAttr{
    Setpgid: true,
}
```

不设置 `Credential`，不设置 `AmbientCaps`；子进程保持 root 与完整能力。

核心文件安全要求：

- 路径固定为 `/usr/lib/gui-for-singbox/cores/sing-box` 或 `sing-box-alpha`。
- 文件必须为普通文件、root 属主、非普通用户可写。
- 文件不得带 file capabilities（`getcap` 为空）；权限只来自守护进程的 root 身份。
- 普通用户直接执行核心文件时不应获得任何特权。

`NoNewPrivileges=yes` 可以保留，因为核心不需要 setuid 或文件能力；若发现核心内部功能需要提权，应先确认具体机制，不得直接关闭整个沙箱。

### 6.5 配置校验与提权边界

`core.configure` 的处理顺序：

1. 校验请求大小、UTF-8、JSON 语法。
2. 拒绝非对象 JSON。
3. 计算 SHA-256。
4. 在内存中保存配置，不使用用户可写临时文件。
5. 通过 `memfd` 或管道文件描述符，把配置传给以**发起用户身份**运行的核心校验进程：
   ```text
   <target-core> check -c /proc/self/fd/<n> -D <session-dir>
   ```
6. 校验成功才在 `/var/lib/gui-for-singbox/users/<uid>/` 创建 root 属主临时文件，写入后 `fsync`，`rename` 到 `config.json`，再 `fsync` 目录。
7. 校验失败则返回核心 stderr，不覆盖旧配置。

说明：

- 校验进程以发起用户运行且不带额外能力，避免守护进程在 root 下直接解析不可信配置。
- 配置最终由 root 持有，普通用户不能在校验后篡改。
- 若配置引用仅 root 可读的文件，用户身份校验可能失败；此时不自动改用 root 重试，应调整资源权限或在文档中说明限制。
- 核心启动时仍会以 root 解析同一配置，因此“完整特权”方案无法把核心解析器漏洞限制在用户权限内；校验用户化只是额外防线，不是安全保证。

### 6.6 为何仍需 daemon，而不是直接以 root 运行核心

核心特权与官方包相同，但官方单核心包只提供固定 systemd unit：

- 配置文件在 `/etc/sing-box`，需要 root 编辑。
- 启动、停止、切换版本依赖 `systemctl` 或包管理器脚本。
- 没有 GUI 会话、socket 认证、每用户配置、日志读取和状态恢复接口。

本方案的 daemon 不改变核心特权，而提供：

1. 受控入口：只有 `gui-for-singbox` 组成员能通过 socket 请求启动核心；核心文件不带 file capabilities，普通用户直接执行不会获得特权。
2. 固定语义 API：不接受任意命令、任意 argv、任意目标路径；配置写入固定每用户目录。
3. 生命周期：启动、停止、重启、崩溃检测、日志尾部读取、缓存清理、开机恢复。
4. stable/alpha 切换：选择不同 root 所有核心路径，无需改 `/etc` 或调用 `systemctl`。
5. 升级解耦：包管理器替换核心文件即可，不需要 postinstall 重设 file capabilities。
6. 审计：所有请求、配置摘要、状态变化、核心退出原因可记录到 journal。

因此系统包模式应做两件事：

- 安装脚本不再对捆绑核心执行 `setcap`。
- 启动 wrapper 不再把核心软链到用户数据目录，前端不再通过用户目录路径执行核心。

非系统包安装继续保留现有 `setcap` + `ExecBackground` 路径，不受此约束。

必须承认：完整特权方案下，daemon 和核心都在 root 边界内，沙箱与固定 API 只能缩小误用面，不能把 root 漏洞降为用户漏洞。若未来要求强隔离，需要改用专用服务用户、预创建 TUN/nft 资源或拆分权限代理；那是另一套架构。

### 6.7 禁止事项

- 禁止 `sudoers`、`NOPASSWD`、通用 helper。
- 禁止通过守护进程执行任意 shell 命令。
- 禁止接受客户端传入的目标文件路径。
- 禁止接受客户端传入的核心路径、核心参数或环境变量。
- 禁止守护进程在 root 下执行任意脚本或命令；`sing-box check` 以发起用户身份运行。
- 禁止把 `gui-for-singbox` 组当作普通用户组自动添加；它是特权组。
- 禁止通过 `systemctl` 直接管理核心 unit。
- 禁止在系统包模式下静默回退到 `setcap` 子进程方案。
- 禁止在系统包模式下保留捆绑核心的 file capabilities。

## 7. 守护进程协议

### 7.1 传输与编码

- Unix domain socket。
- 换行分隔的 JSON（NDJSON）。
- 每个请求/响应一帧；帧大小上限 16 MiB。
- 兼容 JSON-RPC 2.0 字段：`jsonrpc`、`id`、`method`、`params`、`result`、`error`。
- 订阅事件使用独立连接，服务端推送 `event` 帧。

示例：

```json
{"jsonrpc":"2.0","id":1,"method":"core.status","params":{}}
{"jsonrpc":"2.0","id":1,"result":{"state":"running","channel":"stable","pid":1234,"ownerUid":1000}}
```

错误：

```json
{"jsonrpc":"2.0","id":1,"error":{"code":-32001,"message":"permission denied","data":"..."}}
```

### 7.2 方法清单

| 方法 | 参数 | 结果 | 说明 |
| --- | --- | --- | --- |
| `daemon.info` | 无 | `{version, socket, channels}` | 守护进程版本、核心路径与版本 |
| `core.status` | 无 | `{state, channel, pid, ownerUid, startedAt, lastError, configSha256}` | 当前状态 |
| `core.configure` | `{channel, config}` | `{sha256, bytes}` | 校验并原子写入当前用户配置，不自动重启 |
| `core.getConfig` | 无 | `{config, sha256}` | 仅会话 owner 可读 |
| `core.start` | `{channel}` | `core.status` | 启动或切换到指定 channel |
| `core.stop` | 无 | `core.status` | 优雅停止核心 |
| `core.restart` | `{channel}` | `core.status` | 停止后启动 |
| `core.switch` | `{channel}` | `core.status` | 切换 stable/alpha |
| `core.readLog` | `{tailBytes}` | `{content, truncated}` | 读取固定日志文件尾部 |
| `core.clearCache` | 无 | `{}` | 仅在停止状态删除 `cache.db` |
| `core.subscribe` | 无 | 事件流 | 推送状态变更 |

### 7.3 状态机

```text
stopped ──start──> starting ──成功──> running
   ▲                  │失败
   │                  ▼
   └──── stop ──── stopping <──stop── failed
```

状态字段：

- `state`: `stopped`、`starting`、`running`、`stopping`、`failed`
- `channel`: `stable`、`alpha`
- `pid`: 核心 PID，未运行时为 0
- `ownerUid`: 当前会话 UID
- `lastError`: 最近一次启动/校验错误
- `configSha256`: 当前配置摘要

并发规则：

- `core.start`、`core.stop`、`core.restart`、`core.switch` 串行执行。
- 同一 channel 已运行且配置未变时，`core.start` 幂等返回当前状态。
- 运行中收到不同 channel 的 `core.start`：等价于 `core.switch`。
- 其他用户的会话运行中：
  - `core.status` 可读。
  - `core.getConfig`、`core.readLog` 仅 owner 或 root 可读。
  - `core.start` 默认返回 `E_BUSY`，前端提示先停止其他会话。
  - `core.stop` 允许同组用户停止，便于释放会话。

### 7.4 事件

`core.subscribe` 连接收到：

```json
{"event":"core.state","data":{"state":"running","channel":"alpha","pid":2345,"ownerUid":1000}}
```

用途：

- Go bridge 接收后通过 Wails `EventsEmit` 发给前端。
- 前端刷新 `running`、`pid`、系统代理/DNS 状态。
- 守护进程崩溃重启后，前端自动重连订阅。

## 8. 配置、日志与缓存

### 8.1 配置生成

现有 `generateConfigFile` 写入逻辑：

```ts
await WriteFile(CoreConfigFilePath, JSON.stringify({ $schema: header, ...config }, null, 2))
```

系统包模式下改为：

```ts
await DaemonApplyConfig(channel, JSON.stringify({ $schema: header, ...config }, null, 2))
```

路径处理：

- 便携模式保持 `../rulesets/...` 相对路径。
- 守护进程模式把逻辑路径展开为绝对路径：
  - `data/rulesets/...` → `<env.dataDir>/rulesets/...`
  - `$APP_DATA_DIR`、`$APP_BASE_PATH` 等魔法变量递归替换。
- `experimental.cache_file.path` 保持相对 `cache.db`，由守护进程设置每用户工作目录。
- 插件/mixin/script 产生的路径也经过同一递归替换，避免核心读取错误位置。

### 8.2 原子写入

- 临时文件与目标文件同目录。
- `O_CREAT|O_EXCL`、`0600`、`root:root`。
- 写入后 `fsync` 文件。
- `rename` 覆盖目标。
- `fsync` 目录。
- 不使用客户端提供的路径，不使用符号链接目标。
- 目录由守护进程创建并校验属主，普通用户不能把目标替换为符号链接。

### 8.3 日志

- 核心 stdout/stderr 由守护进程接管。
- 守护进程持续写入 `users/<uid>/core.log`，并维护有界内存环形缓冲。
- 日志文件按大小轮转，例如 5 MiB × 2 份，避免无限增长。
- GUI 通过 `core.readLog` 读取尾部，不直接读文件。
- 停止/崩溃后前端读取尾部日志并写入 `logsStore`。
- 守护进程自身日志使用 systemd journal，不混入核心日志。

### 8.4 缓存

- 每个用户独立 `cache.db`。
- `core.clearCache` 只删除固定路径，不接受路径参数。
- 核心运行中拒绝清理，返回 `E_BUSY`。
- 清理后由前端决定是否重启核心。

### 8.5 nftables 与系统进程追踪

nftables：

- 核心以 root 运行，`auto_redirect`、`bridge` 的 nftables 规则、TUN 路由、透明代理与官方包能力一致。
- systemd unit 保留 `AF_NETLINK`，不设置 `PrivateNetwork`。
- 不设置会截断 `CAP_NET_ADMIN` 的能力集。
- 安装后验证 `nft list tables` 可见 `sing-box-*` 表，停止后清理。

系统进程追踪：

- `sing-box` 的 Linux 进程搜索器通过 netlink `sock_diag` 定位 socket inode，再扫描 `/proc/<pid>/fd` 与 `/proc/<pid>/exe`。
- 非 root 无法可靠读取其他用户进程；核心 root 后可覆盖系统全部 UID。
- 配置需启用 `route.find_process: true`，否则连接元数据可能没有 `processPath`。
- 系统包模式下新配置默认 `find_process: true`；已有配置在生成时补为 `true`。
- 前端连接列表已有 `metadata.processPath` 列，无需新增 API；只需确保核心返回该字段。
- 若系统启用 `hidepid=2` 或 systemd `ProtectProc=invisible`，进程信息可能缺失；unit 不设置 `ProtectProc=invisible`，文档记录 `hidepid` 排查方法。

## 9. 进程生命周期

### 9.1 启动

1. 检查 `config.json` 存在且非空。
2. 选择核心路径：
   - `stable` → `/usr/lib/gui-for-singbox/cores/sing-box`
   - `alpha` → `/usr/lib/gui-for-singbox/cores/sing-box-alpha`
3. 校验核心文件为普通文件、root 属主、不可被普通用户写、无 file capabilities。
4. 确保会话目录存在且属主为 root。
5. 创建日志管道或日志文件。
6. `exec.Command` 启动核心，不设置 `Credential`、不设置 `AmbientCaps`，只设置 `Setpgid` 与固定环境；核心保持 root 与完整能力。
7. 状态置为 `starting`，保存期望运行状态。
8. 监听子进程退出和日志。
9. 状态置为 `running`，推送事件。

### 9.2 停止

1. 状态置为 `stopping`。
2. 向核心进程组发送 `SIGTERM`。
3. 最长等待 10 秒。
4. 未退出则发送 `SIGKILL`。
5. `Wait` 回收子进程。
6. 状态置为 `stopped`，保存期望停止状态。
7. 推送事件。

不能只杀主 PID；使用 `Setpgid` 后按进程组发送信号，确保子进程一并退出。

### 9.3 崩溃与恢复

- 核心异常退出：
  - 状态置为 `failed`。
  - 记录退出码、信号、最后日志。
  - 不自动无限重启；由前端决定是否重启。
  - 推送 `core.state` 事件。
- 守护进程崩溃/重启：
  - systemd 重启守护进程。
  - 读取 `state.json`。
  - 若 `desiredRunning=true`，用保存的 UID、channel、配置恢复核心。
  - 恢复失败则记录 `lastError`，状态 `failed`。
- systemd `KillMode=control-group` 确保守护进程退出时核心不会残留。

### 9.4 stable/alpha 切换

流程：

1. 前端设置 `appSettings.app.kernel.branch`。
2. `restartCore` 调用 `DaemonSwitch(channel)`。
3. 守护进程停止当前核心。
4. 选择新 channel 对应二进制。
5. 使用当前 `config.json` 重新校验并启动。
6. 返回新状态。

配置文件不按 channel 分裂；同一配置可用于两个核心版本。若核心版本对配置字段有差异，由 `sing-box check` 在启动前报告。

## 10. systemd 单元

### 10.1 socket unit

```ini
[Unit]
Description=GUI for SingBox Daemon Socket

[Socket]
ListenStream=/run/gui-for-singbox/daemon.sock
SocketMode=0660
SocketUser=root
SocketGroup=gui-for-singbox
DirectoryMode=0750
RemoveOnStop=yes

[Install]
WantedBy=sockets.target
```

说明：

- `DirectoryMode` 创建 `/run/gui-for-singbox`。
- `SocketGroup` 决定哪些用户可连接。
- 不需要 polkit。

### 10.2 service unit

初稿：

```ini
[Unit]
Description=GUI for SingBox Core Daemon
Documentation=https://github.com/Bubble-droid/GUI.for.SingBox
After=network-online.target
Wants=network-online.target
Requires=gui-for-singbox-daemon.socket

[Service]
Type=notify
ExecStart=/usr/lib/gui-for-singbox/gui-for-singbox-daemon --socket /run/gui-for-singbox/daemon.sock --state-dir /var/lib/gui-for-singbox
Restart=on-failure
RestartSec=2
TimeoutStopSec=20
KillMode=control-group
UMask=0077

StateDirectory=gui-for-singbox
StateDirectoryMode=0755
RuntimeDirectory=gui-for-singbox
RuntimeDirectoryMode=0750
LimitNOFILE=1048576

# 不设置 CapabilityBoundingSet / AmbientCapabilities：
# 核心需要与官方包一致的完整特权。
NoNewPrivileges=yes

ProtectSystem=strict
ProtectHome=read-only
PrivateTmp=yes
PrivateDevices=no
ProtectKernelTunables=no
ProtectKernelModules=yes
ProtectControlGroups=yes
RestrictRealtime=yes
RestrictSUIDSGID=yes
LockPersonality=yes
RestrictAddressFamilies=AF_UNIX AF_INET AF_INET6 AF_NETLINK AF_PACKET
ReadWritePaths=/var/lib/gui-for-singbox /run/gui-for-singbox
```

说明：

- service 不设置 `[Install]`，由 socket unit 按需激活；安装时只启用并启动 socket。
- 守护进程需要读取 `LISTEN_PID`、`LISTEN_FDS`，把继承的 fd 直接作为监听 socket；没有继承 fd 时才按 `--socket` 路径自行绑定。
- `PrivateDevices=no`：核心需要 `/dev/net/tun`。
- `ProtectHome=read-only`：核心需要读取用户规则集，但不能写用户目录。
- `ProtectSystem=strict`：系统目录只读；可写范围仅状态目录和运行目录。
- 不设置 `CapabilityBoundingSet=` / `AmbientCapabilities=`：核心与守护进程都需要完整特权，才能使用 nftables、TUN、透明代理和跨用户进程追踪。
- `ProtectKernelTunables=no`：TUN 与透明代理可能需要写 `/proc/sys/net`。
- `ProtectProc` 不设为 `invisible`，否则核心无法扫描其他用户的 `/proc/<pid>`；默认 `default`。
- `Type=notify`：守护进程监听成功后发送 `READY=1`；可用标准库实现 `sd_notify`，不引入依赖。
- `Restart=on-failure`：仅守护进程异常退出时重启；核心退出由守护进程管理。
- `NoNewPrivileges=yes` 不影响本方案：核心不使用 setuid 或文件能力，权限直接来自 root 父进程。

### 10.3 安装与卸载

安装：

1. 创建 `gui-for-singbox` 组。
2. 不需要创建同名的专用服务用户；守护进程为 root。
3. `systemctl daemon-reload`。
4. `systemctl preset gui-for-singbox-daemon.socket`。
5. 如果 systemd 正在运行，`systemctl start gui-for-singbox-daemon.socket`。
6. 不启动 service；首次 socket 连接时自动激活。

卸载：

1. 如果 systemd 正在运行，停止并禁用 socket/service。
2. 保留 `/var/lib/gui-for-singbox`，避免升级或重装丢失会话状态。
3. 不自动删除 `gui-for-singbox` 组。
4. 明确提示状态目录和组成员关系仍保留。

## 11. 打包与构建

### 11.1 `nfpm.yaml` 新增内容

```yaml
- src: ./build/bin/gui-for-singbox-daemon
  dst: /usr/lib/gui-for-singbox/gui-for-singbox-daemon
  file_info:
    mode: 0755
- src: ./packaging/linux/gui-for-singbox-daemon.socket
  dst: /usr/lib/systemd/system/gui-for-singbox-daemon.socket
  file_info:
    mode: 0644
- src: ./packaging/linux/gui-for-singbox-daemon.service
  dst: /usr/lib/systemd/system/gui-for-singbox-daemon.service
  file_info:
    mode: 0644
```

可选：

```yaml
- src: ./packaging/linux/sysusers/gui-for-singbox.conf
  dst: /usr/lib/sysusers.d/gui-for-singbox.conf
  file_info:
    mode: 0644
```

### 11.2 移除内容

- `cmd/helper/main.go`、`cmd/helper.sh`。
- `packaging/linux/systemd/` 整个重复目录。
- `packaging/linux/gui-for-singbox-core.service`。
- `postinstall.sh` 中 sudoers、helper、共享数据目录逻辑。
- `gui-for-singbox.rules` 中 `org.freedesktop.systemd1.manage-units` 规则。
- 系统包 postinstall 中针对捆绑核心的 `setcap` 逻辑。
- `nfpm.yaml` 中仅为 setcap 服务的 `libcap` / `libcap2-bin` 依赖（需确认是否有其他用途）。

### 11.3 启动 wrapper

`packaging/linux/gui-for-singbox.sh` 简化为：

```sh
#!/bin/sh
set -eu
exec /usr/lib/gui-for-singbox/gui-for-singbox "$@"
```

移除把 `/usr/lib/gui-for-singbox/cores/*` 软链到用户数据目录的逻辑。系统包模式下核心路径由守护进程固定管理，不通过用户目录软链。

### 11.4 安装脚本

统一 `packaging/linux/scripts/postinstall.sh`，避免 deb/rpm/arch 三份逻辑长期漂移：

1. 幂等创建组。
2. 输出组成员提示。
3. 如果 systemd 可用：
   - `systemctl daemon-reload`
   - `systemctl preset gui-for-singbox-daemon.socket`
   - `systemctl start gui-for-singbox-daemon.socket`
4. 不写 sudoers，不 chown 共享目录，不设置核心文件能力。
5. deb/rpm 的依赖建议文本移入公共脚本或按发行版参数化。

`postremove.sh`：

1. systemd 可用时停止并禁用 socket/service。
2. 保留状态目录。
3. 提示组和状态目录未自动删除。

### 11.5 `scripts/task.sh`

新增：

```sh
build-daemon() {
  echo "==> Building Linux daemon (${ARCH})..."
  GOOS=linux GOARCH="$ARCH" CGO_ENABLED=0 \
    go build -trimpath -buildvcs=false \
    -ldflags "-X '${GO_MODULE}/internal/daemon.Version=${APP_VERSION}'" \
    -o "${BIN_DIR}/gui-for-singbox-daemon" ./cmd/daemon
}
```

构建依赖：

- `build-linux-package` 必须调用 `build-daemon`。
- `package-deb`、`package-rpm`、`package-pacman` 通过 `ensure_package_binary` 后确保 daemon 已构建。
- `clean_bin` 删除 `build/bin/gui-for-singbox-daemon`。
- daemon 使用纯 Go、`CGO_ENABLED=0`，不依赖 GTK/WebKit。
- 主程序仍使用 `SystemPackage=true` 的专用构建；daemon 不需要该标志。

## 12. 后端 bridge 重构

### 12.1 文件划分

- `internal/daemon/`：可测试的守护进程核心库。
  - `server.go`：socket 监听、认证、协议分发。
  - `auth_linux.go`：`SO_PEERCRED`、组校验、`/proc` 校验。
  - `protocol.go`：请求/响应/事件类型。
  - `manager.go`：状态机、配置写入、进程管理。
  - `process_linux.go`：固定 argv/环境、进程组、信号、核心文件校验。
  - `config.go`：大小限制、JSON 校验、原子写入、`sing-box check`。
  - `log.go`：日志文件、环形缓冲、轮转。
  - `notify_linux.go`：最小 `sd_notify` 实现。
  - `*_test.go`：单元测试。
- `cmd/daemon/main.go`：参数解析、初始化、信号处理，薄入口。
- `bridge/daemon_linux.go`：GUI 侧 Unix socket JSON-RPC 客户端。
- `bridge/daemon_others.go`：非 Linux stub，返回 `not supported`。
- `bridge/daemon_types.go`：前后端共享的 JSON 结构。

### 12.2 Wails 暴露方法

建议在 `App` 上增加：

| Go 方法 | 前端用途 |
| --- | --- |
| `DaemonInfo() FlagResult` | 判断 socket 可用、读取 channel/version |
| `DaemonStatus() FlagResult` | 初始化与刷新状态 |
| `DaemonApplyConfig(channel, config string) FlagResult` | 替代 `WriteFile(CoreConfigFilePath)` |
| `DaemonGetConfig() FlagResult` | 替代 `ReadFile(CoreConfigFilePath)` |
| `DaemonStart(channel string) FlagResult` | 启动核心 |
| `DaemonStop() FlagResult` | 停止核心 |
| `DaemonRestart(channel string) FlagResult` | 重启 |
| `DaemonSwitch(channel string) FlagResult` | 切换 stable/alpha |
| `DaemonReadLog(tailBytes int) FlagResult` | 替代 `ReadFile(CoreLogFilePath)` |
| `DaemonClearCache() FlagResult` | 替代 `RemoveFile(CoreCacheFilePath)` |
| `DaemonWatch() FlagResult` | 启动状态订阅 goroutine |

返回格式保持 `FlagResult{Flag, Data}`，`Data` 为 JSON 字符串。

### 12.3 错误映射

建议错误码：

| 码 | 含义 | 前端行为 |
| --- | --- | --- |
| `-32001` | 未授权/组不匹配 | 提示加入组并重新登录 |
| `-32002` | socket 不可用 | 提示检查 systemd socket |
| `-32003` | 配置校验失败 | 展示核心 stderr |
| `-32004` | 会话被其他用户占用 | 提示先停止其他会话 |
| `-32005` | 核心未运行/已运行 | 前端状态纠正 |
| `-32006` | 参数非法 | 记录日志并提示 |
| `-32007` | 内部错误 | 展示摘要，写入日志 |

### 12.4 状态订阅

`DaemonWatch`：

- 只启动一次，使用 `sync.Once`。
- 建立长连接，发送 `core.subscribe`。
- 收到事件后 `runtime.EventsEmit(a.Ctx, "daemonCoreState", payload)`。
- 断线后指数退避重连，最大 30 秒。
- 应用退出时关闭连接。

前端在 `kernelApi` 初始化时注册 `EventsOn('daemonCoreState', ...)`。

### 12.5 生成绑定

新增方法后需要重新生成 Wails 绑定：

```sh
./.bin/wails generate module
```

当前 `task.sh` 使用 `-skipbindings`，因此需要显式生成并提交 `frontend/src/bridge/wailsjs/go/bridge/App.{d.ts,js}` 与模型文件。

## 13. 前端重构

### 13.1 模式判定

在 `frontend/src/utils/helper.ts` 增加统一入口：

```ts
export const isDaemonCoreMode = () => {
  const { env } = useEnvStore()
  return env.os === OS.Linux && env.isSystemPackage
}
```

不要在各处重复 `os === 'linux' && isSystemPackage`。

### 13.2 `kernelApi.ts` 分支

| 操作 | 现有实现 | 守护进程模式 |
| --- | --- | --- |
| `initCoreState` | `ReadFile(pid)` + `ProcessInfo` | `DaemonStatus` |
| `runCoreProcess` | `ExecBackground` | `DaemonStart(channel)` + 探测 REST API |
| 停止 | `KillProcess(pid)` | `DaemonStop` |
| 重启 | stop + start | `DaemonRestart` / `DaemonSwitch` |
| 配置读取 | `ReadFile(CoreConfigFilePath)` | `DaemonGetConfig` |
| 配置写入 | `generateConfigFile` 内 `WriteFile` | `DaemonApplyConfig` |
| 日志 | `ReadFile(CoreLogFilePath, Range: '-4096')` | `DaemonReadLog(4096)` |
| PID 文件 | `PidFile` | 不使用 |
| 停止后清理 PID | `RemoveFile(CorePidFilePath)` | 不执行 |
| 缓存清理 | `RemoveFile(CoreCacheFilePath)` | `DaemonClearCache` |
| 崩溃感知 | `ExecBackground` end event | `daemonCoreState` 事件 |

`onCoreStopped` 仍需：

- 销毁 WebSocket。
- 更新系统代理状态。
- 清理系统代理/系统 DNS。
- 重置配置视图。
- 触发插件停止钩子。

### 13.3 `generator.ts` 分支

- 增加 `resolveConfigPathsForDaemon(config)`：
  - 递归替换 `$APP_DATA_DIR`、`$APP_BASE_PATH`。
  - 把 `rule_set[].path` 的 `data/...` 转为绝对路径。
  - 对 `dns.servers[].path`、hosts 路径等做同样处理。
- `generateConfigFile`：
  - 便携模式：保持 `WriteFile(CoreConfigFilePath, ...)`。
  - 守护进程模式：调用 `DaemonApplyConfig(channel, ...)`。
- 不改变配置本身的代理语义，只改变外部资源路径表达。

### 13.4 `useCoreBranch.ts` 分支

系统包模式：

- `localVersion`/`versionDetail` 从 `DaemonInfo` 或直接执行打包核心 `version` 获取。
- 隐藏或禁用“下载更新”“回滚”“授予 TUN 权限”。
- 显示“核心由系统包管理”提示。
- `openFileLocation` 可打开 `/usr/lib/gui-for-singbox/cores`，但只读。
- `restartCore` 继续使用 `kernelApiStore.restartCore`，由后端切换 channel。
- `downloadCore` 在系统包模式下直接返回错误或由 UI 禁止调用。

### 13.5 `BranchDetail.vue`

按模式隐藏按钮：

| 按钮 | 便携模式 | 系统包模式 |
| --- | --- | --- |
| 更新核心 | 显示 | 隐藏 |
| 回滚核心 | 显示 | 隐藏 |
| 授予 TUN 权限 | 显示 | 隐藏 |
| 清理缓存 | 显示 | 显示（走守护进程） |
| 打开目录 | 显示 | 可显示（只读） |
| 重启核心 | 显示 | 显示 |

### 13.6 国际化

新增文案建议：

- `settings.kernel.packageManaged`：核心由系统包管理，请通过包管理器更新。
- `settings.kernel.daemonUnavailable`：守护进程不可用，请检查 `gui-for-singbox-daemon.socket`。
- `settings.kernel.permissionDenied`：当前用户不在 `gui-for-singbox` 组，无法管理核心。
- `settings.kernel.groupHint`：执行 `sudo usermod -aG gui-for-singbox <user>` 后重新登录。
- `settings.kernel.sessionBusy`：核心正被其他用户会话使用。

### 13.7 常量

- 保留 `CoreWorkingDirectory`、`CorePidFilePath`、`CoreLogFilePath`、`CoreConfigFilePath`、`CoreCacheFilePath`，供便携模式继续使用。
- 增加包装函数：
  - `getKernelFilePath(isAlpha)`：便携模式返回用户数据路径；系统包模式返回 `/usr/lib/gui-for-singbox/cores/...`。
  - `getCoreLogPath()`、`getCoreConfigPath()` 只在便携模式使用。
- 不要在系统包模式下把 `CoreWorkingDirectory` 改成 `/var/lib` 后继续用 `WriteFile` 访问；必须走 socket。

## 14. 与旧方案共存的判定矩阵

| 环境 | `IsSystemPackage` | 核心来源 | 启动方式 | 权限 |
| --- | --- | --- | --- | --- |
| Windows 便携 | false | 用户下载 | `ExecBackground` | Windows 机制 |
| macOS 便携 | false | 用户下载 | `ExecBackground` | setuid / osascript |
| Linux 便携/tar.gz | false | 用户下载 | `ExecBackground` | `setcap` |
| Linux 系统包 | true | 包内 stable/alpha | 守护进程 | root，完整特权，systemd 沙箱 |
| Linux 系统包，systemd 不可用 | true | 包内 stable/alpha | 不可用，明确报错 | 不静默回退 |

判定以 `Env.IsSystemPackage` 为准，不根据二进制路径二次猜测。`bridge/storage_linux.go` 现有路径检测仅保留为旧二进制的兼容后备。

## 15. 文件级改动清单

### 15.1 删除/废弃

- `bridge/daemon_linux.go`（现有不安全版本，替换为客户端）
- `cmd/helper/main.go`
- `cmd/helper.sh`
- `packaging/linux/systemd/`（重复 unit 与预编译 helper）
- `packaging/linux/gui-for-singbox-core.service`

### 15.2 新增

- `cmd/daemon/main.go`
- `internal/daemon/server.go`
- `internal/daemon/auth_linux.go`
- `internal/daemon/protocol.go`
- `internal/daemon/manager.go`
- `internal/daemon/process_linux.go`
- `internal/daemon/config.go`
- `internal/daemon/log.go`
- `internal/daemon/notify_linux.go`
- `internal/daemon/*_test.go`
- `bridge/daemon_linux.go`（客户端实现）
- `bridge/daemon_others.go`
- `bridge/daemon_types.go`
- `packaging/linux/gui-for-singbox-daemon.socket`
- `packaging/linux/gui-for-singbox-daemon.service`
- `packaging/linux/sysusers/gui-for-singbox.conf`（可选）

### 15.3 修改

- `bridge/bridge.go`：如需暴露 `coreBackend`，在 `GetEnv` 中增加字段。
- `bridge/types.go`：增加 daemon 状态/信息结构。
- `nfpm.yaml`：新增 daemon 与 unit，移除 helper/sudoers 相关内容。
- `scripts/task.sh`：新增 `build-daemon`，接入打包流程，更新 `clean`。
- `packaging/linux/scripts/postinstall.sh`：重写为组创建 + systemd socket 配置。
- `packaging/linux/scripts/deb/postinstall.sh`、`rpm/postinstall.sh`：统一或调用公共逻辑。
- `packaging/linux/scripts/postremove.sh`：停止/禁用 socket/service，保留状态目录。
- `packaging/linux/gui-for-singbox.rules`：移除 manage-units 规则，保留 DNS 规则。
- `packaging/linux/gui-for-singbox.sh`：移除核心软链逻辑。
- `frontend/src/utils/helper.ts`：增加 `isDaemonCoreMode`、核心路径包装。
- `frontend/src/utils/generator.ts`：守护进程模式路径展开与配置提交。
- `frontend/src/stores/kernelApi.ts`：生命周期分支、状态订阅。
- `frontend/src/hooks/useCoreBranch.ts`：系统包模式禁用自更新、版本来源调整。
- `frontend/src/views/SettingsView/components/components/BranchDetail.vue`：按钮可见性。
- `frontend/src/lang/zh-CN.ts`、`en-US.ts`：新增文案。
- `frontend/src/bridge/wailsjs/go/bridge/App.d.ts`、`App.js`：重新生成。
- `frontend/src/bridge/index.ts`：导出 daemon 客户端方法。
- `README.md` 或新增 `docs/linux-daemon.md`：安装后组成员说明、故障排查。

## 16. 分阶段实施计划

### 阶段 0：清理与准备

- 已通过 stash 移除不安全 WIP。
- 确认 `docs/linux-daemon-plan.md`。
- 建立单独实现分支或继续当前分支。
- 输出验收：工作区干净，只有规划文档。

### 阶段 1：守护进程核心库

- 实现 `internal/daemon` 协议、认证、状态机。
- 实现固定路径配置写入和原子替换。
- 实现 `sing-box check` 校验（以请求用户身份运行，避免 root 直接解析不可信配置）。
- 实现进程启动/停止/崩溃检测。
- 实现日志环形缓冲和尾部读取。
- 实现 stable/alpha 路径映射。
- 单元测试覆盖率目标：协议、认证、配置、状态机、进程信号。
- 验收：本地不安装 systemd 单元也能用临时 socket 和测试用户完成集成测试。

### 阶段 2：systemd 与打包

- 添加 socket/service unit。
- 重写安装/卸载脚本。
- 更新 `nfpm.yaml`。
- 新增 `build-daemon` 并接入 `package-linux`。
- 删除 helper、重复 unit、sudoers 逻辑、核心 setcap。
- 在 Debian/RPM/Arch 至少各做一次安装/升级/卸载测试。
- 验收：安装后 socket 存在、权限正确、首次连接自动拉起 daemon。

### 阶段 3：后端 bridge 客户端

- 实现 Unix socket NDJSON 客户端。
- 实现超时、错误码映射、连接失败处理。
- 实现状态订阅并转发 Wails 事件。
- 增加非 Linux stub。
- 生成 Wails 绑定。
- 验收：前端可调用所有 daemon 方法，错误可读。

### 阶段 4：前端接入

- 增加模式判定。
- 修改 `kernelApi` 生命周期。
- 修改 `generator` 配置提交与路径展开。
- 修改 `useCoreBranch` 版本/更新行为。
- 修改 `BranchDetail` 按钮。
- 增加国际化文案。
- 验收：系统包模式启动/停止/重启/切换 stable-alpha/清理缓存/日志读取全流程可用；便携模式无回归。

### 阶段 5：安全加固与回归

- 验证非组成员被拒绝。
- 验证恶意配置、超大请求、非法 JSON、符号链接、路径穿越。
- 验证核心崩溃、守护进程崩溃、systemd 重启恢复。
- 验证 TUN、系统代理、系统 DNS。
- 验证升级后状态保留、核心文件更新、unit 更新。
- 验证无 systemd 环境明确报错。
- 更新文档和故障排查：`docs/linux-daemon.md`。

## 17. 测试计划

### 17.1 Go 单元测试

- `protocol_test.go`
  - 请求/响应/事件编码。
  - 超大帧拒绝。
  - 非法 JSON 拒绝。
- `auth_linux_test.go`
  - root 允许。
  - 目标组用户允许。
  - 非组成员拒绝。
  - `/proc` 解析失败拒绝。
  - PID 复用检测。
- `config_test.go`
  - 非对象 JSON 拒绝。
  - 超大配置拒绝。
  - 校验失败保留旧配置。
  - 原子替换后权限/属主正确。
  - 目标为符号链接时拒绝。
- `manager_test.go`
  - 状态机合法/非法转换。
  - start/stop/restart/switch 幂等。
  - 其他用户会话 busy。
- `process_linux_test.go`
  - 子进程保持 root。
  - 核心文件属主/权限/file capabilities 校验。
  - 固定 argv 与固定环境。
  - 进程组停止。
  - 异常退出状态 `failed`。
- `log_test.go`
  - 尾部读取。
  - 轮转。
  - 并发写入。

### 17.2 集成测试

在带 systemd 的虚拟机或容器中：

1. 安装 `.deb` / `.rpm` / `.pkg.tar.zst`。
2. 创建测试用户并加入组。
3. 首次连接触发 socket activation。
4. 提交配置、启动核心、访问 REST API。
5. 切换 stable/alpha，确认 PID 变化和版本变化。
6. 停止核心，确认进程组全部退出。
7. 重启 systemd 或 kill 守护进程，确认恢复。
8. 升级包，确认状态目录、配置、日志保留。
9. 卸载，确认 unit 移除但状态目录保留。

### 17.3 安全测试

- 非组成员直接连接 socket，应 `EACCES`/拒绝。
- 组成员发送超大配置，应拒绝。
- 组成员发送包含任意路径的字段，daemon 不应将其用于文件操作。
- 组成员尝试通过配置让 root 解析，确认 `sing-box check` 以用户身份运行。
- 核心文件被普通用户替换，应被属主/权限检查拒绝。
- socket 目录被替换为符号链接，应拒绝启动。
- 守护进程不接受 TCP 连接。

### 17.4 回归测试

- 便携 Linux 包 `setcap` 启动核心。
- Windows/macOS 构建不受影响。
- 系统代理、系统 DNS、TUN 模式。
- 插件在启动/停止钩子中的行为。
- 自动重启（`autoRestartKernel`）与自动启动（`autoStartKernel`）。
- 关闭应用时 `closeKernelOnExit`。

## 18. 风险与应对

| 风险 | 影响 | 应对 |
| --- | --- | --- |
| systemd 沙箱阻止 nftables/TUN | 透明代理或 TUN 失败 | 保留完整能力，`ProtectKernelTunables=no`、`PrivateDevices=no`；在目标发行版实测 |
| `ProtectHome=read-only` 影响用户资源读取 | 本地规则集读取失败 | 核心以 root 读取绝对路径；只读挂载足够；测试自定义 XDG 路径 |
| `hidepid=2` 或 `ProtectProc=invisible` | 进程路径缺失 | unit 不设 `invisible`；文档说明检查 `/proc` 挂载参数 |
| systemd 版本过旧 | socket activation 不可用 | 声明最低 systemd 版本；安装脚本检测并明确报错 |
| 多用户会话冲突 | 其他用户核心被停止 | 默认 `E_BUSY`；显式停止/启动；记录审计日志 |
| 配置路径仍为相对路径 | 核心读取错误文件 | 前端递归展开路径；`sing-box check` 提前发现 |
| 包管理器更新核心后版本不一致 | GUI 显示旧版本 | 版本从包内核心动态读取；不使用缓存文件 |
| 升级后 unit 未重载 | 旧 unit 继续运行 | 安装脚本统一 `daemon-reload` + `preset` |
| AppArmor/SELinux 阻止 socket 或 TUN | 无法启动 | 文档提供策略；测试主流发行版 |
| 守护进程或核心 root 被攻破 | 高风险（与官方包相同） | socket 认证、特权组、固定语义 API、配置以用户身份预校验、systemd 沙箱、代码审计 |
| 回退到便携方案 | 系统包用户失去管理能力 | 明确错误并提供手动修复说明，不静默降级 |

## 19. 回滚策略

- 保留 stash 和 `/tmp/opencode/gui-singbox-daemon-wip` 备份。
- 阶段 1-3 可在未接入前端前单独合入，不影响现有行为。
- 阶段 4 前端接入使用统一 `isDaemonCoreMode` 判定，可整体回退。
- 如果守护进程方案失败，可回到当前 `setcap` 系统包方案：
  - 恢复 `postinstall.sh` 的核心 `setcap`。
  - 恢复 `gui-for-singbox.sh` 的核心软链。
  - 前端恢复 `ExecBackground` 路径。
- 不删除现有 `setcap` 代码路径，直到守护进程方案完成全部验收。

## 20. 需要确认的决策

以下事项建议在实现前确认：

1. **状态目录命名**
   - 推荐：`/var/lib/gui-for-singbox`。
   - 备选：`/var/lib/gui-for-singbox-daemon`（更明确但与应用数据目录不一致）。

2. **系统包模式是否允许 GUI 自行更新核心**
   - 推荐：不允许，由包管理器更新；GUI 仅显示包内版本。
   - 备选：允许下载到用户目录并由守护进程运行，但会重新引入来源校验和路径权限问题。

3. **跨用户会话冲突策略**
   - 推荐：默认 `E_BUSY`，允许同组用户显式停止后启动。
   - 备选：加入 polkit takeover action，跨用户操作需要认证。

4. **守护进程是否在无 GUI 时自动恢复核心**
   - 推荐：仅在 `state.json` 记录 `desiredRunning=true` 时恢复；首次安装不自动运行。
   - 备选：依赖 GUI 的 `autoStartKernel`，守护进程不自动恢复。

5. **是否接受守护进程与核心以 root 运行**
   - 推荐：接受，与官方包一致，换取完整 nftables/TUN/透明代理/进程追踪能力；用 systemd 沙箱、固定 API、特权组和 socket 认证收敛风险。
   - 备选：专用服务用户 + 核心降权，但会失去跨用户进程追踪和部分 nftables/TUN 能力，需要额外同步用户资源。

6. **最低 systemd 版本**
   - 推荐：声明支持 socket activation 的版本，例如 systemd 239+。
   - 需要在目标发行版矩阵中验证。

7. **旧 `setcap` 是否保留给系统包作为故障回退**
   - 推荐：不保留，避免双重权限路径。
   - 备选：仅作为手动诊断工具，不自动启用。

## 21. 与官方 sing-box GUI 方案的对应关系

官方 GUI（`dist/sing-box-for-desktop`）的可借鉴点：

- 使用守护进程 + Unix socket，而不是 GUI 直接启动特权核心。
- Linux 默认 socket：`/run/sing-box.socket`。
- 使用 `SO_PEERCRED` 获取对端 UID/PID/start time，用于认证。
- 守护进程使用 `StateDirectory` 管理状态目录，`UMask=0077`。
- 核心配置由守护进程持有，GUI 通过 API 提交。
- 跨用户接管使用 polkit action。
- 多用户场景使用 per-user working directory 和 owner 记录。

本方案的差异：

- 使用 NDJSON over Unix socket，而不是 gRPC/Connect，减少依赖和代码量。
- 使用 `gui-for-singbox-daemon.socket` 的 socket activation，组权限直接授权，不依赖 polkit。
- 核心作为守护进程的子进程以 root 运行，而不是在守护进程内嵌运行；权限与官方包一致，同时便于隔离核心崩溃与日志管理。
- 保留现有 GUI 的配置生成、系统代理、系统 DNS 和插件逻辑。
- 系统包模式禁用核心自更新，核心由包管理器维护。
