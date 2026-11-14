# Linux 系统守护进程核心管理

本文说明 Linux 系统软件包安装（`IsSystemPackage == true`）下的核心管理方式。便携包、解压运行、Windows 与 macOS 均不使用本方案。

## 1. 架构

```text
GUI（普通用户，gui-for-singbox 组成员）
   │  Unix domain socket + JSON-RPC（NDJSON）
   ▼
gui-for-singbox-daemon（root，完整特权）
   │  fork/exec，固定 argv、固定环境
   ▼
sing-box（root，完整特权）
```

- 守护进程通过 systemd socket activation 按需启动，GUI 不需要 `systemctl` 权限。
- 守护进程只接受固定语义的请求，不接收任意命令、任意参数、任意环境变量或任意文件路径。
- 系统包模式下，核心以 root 运行，具备完整 TUN、nftables、透明代理和系统进程追踪能力。
- stable 与 alpha 核心随软件包提供，切换由守护进程完成。
- 系统包模式不使用 `setcap`、`sudo`、`sudoers`、`pkexec` 或特权 helper。

## 2. 文件与目录

| 路径 | 用途 |
| --- | --- |
| `/usr/lib/gui-for-singbox/gui-for-singbox-daemon` | 守护进程 |
| `/usr/lib/gui-for-singbox/cores/sing-box` | stable 核心 |
| `/usr/lib/gui-for-singbox/cores/sing-box-alpha` | alpha 核心 |
| `/usr/lib/systemd/system/gui-for-singbox-daemon.socket` | socket activation unit |
| `/usr/lib/systemd/system/gui-for-singbox-daemon.service` | 守护进程 service unit |
| `/run/gui-for-singbox/daemon.sock` | 守护进程 Unix socket |
| `/var/lib/gui-for-singbox/state.json` | 崩溃恢复状态 |
| `/var/lib/gui-for-singbox/users/<uid>/config.json` | 当前用户已提交配置 |
| `/var/lib/gui-for-singbox/users/<uid>/core.log` | 当前用户核心日志 |
| `/var/lib/gui-for-singbox/users/<uid>/cache.db` | 当前用户核心缓存 |

核心日志按大小轮转，默认单个文件 5 MiB，保留 2 个备份。GUI 的“清除缓存”在守护进程模式下通过守护进程删除对应用户的 `cache.db`。

## 3. 用户与权限

`gui-for-singbox` 是特权组：组成员可以让 root 守护进程以 root 启动 sing-box 核心。安装脚本不会自动把任何用户加入该组。

```bash
sudo usermod -aG gui-for-singbox <user>
```

用户需要重新登录，组关系才会生效。加入前请确认该用户可信。

> 安全警告：不要把不受信任的用户加入 `gui-for-singbox` 组。组成员能够管理以 root 运行的核心，其权限影响等同于授予该用户系统级网络控制能力。

## 4. 配置与启动流程

1. GUI 生成配置，并将本地规则集路径转换为绝对路径。
2. 配置通过 `core.configure` 提交给守护进程。
3. 守护进程先以请求用户身份执行 `sing-box check`；校验失败时保留旧配置。
4. 校验通过后原子写入 `/var/lib/gui-for-singbox/users/<uid>/config.json`。
5. `core.start` 以 root 启动固定路径的核心。
6. GUI 通过核心 REST API 确认启动完成，再更新系统代理、系统 DNS 和托盘状态。

系统包模式强制启用 `route.find_process`，以便连接列表显示发起连接的系统进程。

## 5. 常用故障排查

检查单元状态：

```bash
systemctl status gui-for-singbox-daemon.socket
systemctl status gui-for-singbox-daemon.service
```

查看守护进程日志：

```bash
journalctl -u gui-for-singbox-daemon.service -b
```

查看核心状态事件：

```bash
journalctl -u gui-for-singbox-daemon.service -b | grep 'core event'
```

核心输出写入 `/var/lib/gui-for-singbox/users/<uid>/core.log`，由 GUI 日志面板读取。GUI 的“清除缓存”同样通过守护进程处理。

### 5.1 `permission denied` / `EACCES`

- 确认当前用户属于 `gui-for-singbox` 组：`id -nG`。
- 修改组后必须重新登录。
- 确认 socket 权限：`ls -l /run/gui-for-singbox/daemon.sock`，应为 `srw-rw---- root gui-for-singbox`。

### 5.2 `daemon core mode is unavailable`

- 确认安装的是系统软件包，而不是便携包。
- 确认 `gui-for-singbox-daemon.socket` 已启用：

```bash
sudo systemctl enable --now gui-for-singbox-daemon.socket
```

### 5.3 无 systemd 环境

系统包方案依赖 systemd socket activation。没有 systemd 时守护进程不会自动启动，安装脚本会给出警告；请改用便携包。

### 5.4 TUN、nftables 或透明代理失败

- unit 保留完整网络与内核能力，同时启用文件系统沙箱。
- 确认没有额外 AppArmor/SELinux 策略阻止 `/usr/lib/gui-for-singbox/`、`/run/gui-for-singbox/` 或核心创建 TUN 设备。
- 检查 `/proc` 挂载参数；`hidepid=2` 可能影响进程路径显示。

### 5.5 核心启动失败

- 守护进程会保留最后一次错误，GUI 会显示对应消息并读取 `core.log` 尾部。
- 配置非法时旧配置不会被覆盖，修正配置后重试即可。
- 核心崩溃会进入 `failed` 状态；重新启动会使用当前已提交配置。

## 6. 升级与卸载

- 升级软件包会更新守护进程、两个核心和 systemd unit；`/var/lib/gui-for-singbox` 下的状态、配置和日志保留。
- 安装脚本执行 `systemctl daemon-reload` 并启用 socket unit。若守护进程正在运行，还会执行 `systemctl try-restart gui-for-singbox-daemon.service`，让新二进制立即取代旧实例；守护进程启动后会恢复升级前正在运行的核心。守护进程未运行时保持非活动，由下一次 GUI 请求通过 socket 激活。
- 卸载会停止并禁用 unit，但不会删除 `/var/lib/gui-for-singbox` 与 `gui-for-singbox` 组，避免误删用户配置。

## 7. 便携模式差异

便携包与非系统包安装继续使用原有方案：

- 核心位于 GUI 数据目录。
- 通过 `setcap` 与 `ExecBackground` 启动子进程。
- 支持 GUI 内下载、替换和回滚核心。
- 不使用守护进程、socket 或 `/var/lib/gui-for-singbox`。

两种模式由 `IsSystemPackage` 明确区分，互不影响。
