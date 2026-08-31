import type * as VueModule from 'vue'

import type { Recordable } from './typescript'

export type OS = 'windows' | 'linux' | 'darwin'
export type Theme = 'auto' | 'light' | 'dark'
export type Color = 'default' | 'green' | 'purple' | 'custom'
export type View = 'grid' | 'list'
export type WindowStartState =
  | 0 // Normal
  | 2 // Minimised
export type WebviewGpuPolicy =
  | 0 // Always
  | 1 // OnDemand
  | 2 // Never
export type RequestProxyMode = 'global' | 'none' | 'system' | 'kernel' | 'custom'
export type RequestMethod = 'GET' | 'POST' | 'DELETE' | 'PUT' | 'HEAD' | 'PATCH'

export interface AppEnv {
  execName: string
  appVersion: string
  basePath: string
  appPath: string
  os: OS
  arch: string
  isPrivileged: boolean
  isSystemPackage: boolean
  isBundled: boolean
  appDataPath: string
  appConfigPath: string
  appCachePath: string
}

export interface TrayContent {
  icon?: string
  title?: string
  tooltip?: string
}

export interface Menu {
  label: string
  handler?: (...args: any) => void
  separator?: boolean
  children?: Menu[] | undefined
}

export interface MenuItem {
  type: 'item' | 'separator'
  text?: string | undefined
  tooltip?: string
  event?: (() => void) | string
  children?: MenuItem[]
  hidden?: boolean
  checked?: boolean
  checkable?: boolean
}

export interface AppSettings {
  lang: 'en' | 'zh'
  theme: Theme
  color: Color
  primaryColor: string
  secondaryColor: string
  fontFamily: string
  systemTitleBar: boolean
  profilesView: View
  subscribesView: View
  rulesetsView: View
  pluginsView: View
  scheduledtasksView: View
  windowStartState: WindowStartState
  webviewGpuPolicy: WebviewGpuPolicy
  contentProtection: boolean
  width: number
  height: number
  exitOnClose: boolean
  closeKernelOnExit: boolean
  autoSetSystemProxy: boolean
  autoSetSystemDNS: boolean
  requestProxyMode: RequestProxyMode
  customProxy: string
  proxyBypassList: string
  systemProxyServices: string[]
  systemProxyDNS: string
  systemDefaultDNS: string
  autoStartKernel: boolean
  autoRestartKernel: boolean
  userAgent: string
  startupDelay: number
  connections: {
    visibility: Record<string, boolean>
    order: string[]
  }
  kernel: {
    realMemoryUsage: boolean
    branch: 'main' | 'alpha'
    profile: string
    autoClose: boolean
    unAvailable: boolean
    cardMode: boolean
    cardColumns: number
    sortByDelay: boolean
    testUrl: string
    testTimeout: number
    concurrencyLimit: number
    controllerCloseMode: 'all' | 'button'
    controllerSensitivity: number
    main: {
      env: Recordable<string>
      args: string[]
    }
    alpha: {
      env: Recordable<string>
      args: string[]
    }
  }
  plugins: {
    sources: { enable: boolean; name: string; url: string }[]
  }
  addPluginToMenu: boolean
  addGroupToMenu: boolean
  pluginSettings: Record<string, Record<string, any>>
  githubApiToken: string
  githubDownloadAcceleration: boolean
  githubDownloadMirror: string
  multipleInstance: boolean
  debugOutline: boolean
  debugNoAnimation: boolean
  debugNoRounded: boolean
  debugBorder: boolean
  debugUsePointer: boolean
  pages: string[]
}

export interface Plugin {
  id: string
  version: string
  name: string
  description: string
  type: 'Http' | 'File'
  url: string
  path: string
  triggers: (
    | 'on::enabled'
    | 'on::disabled'
    | 'on::manual'
    | 'on::subscribe'
    | 'on::generate'
    | 'on::startup'
    | 'on::shutdown'
    | 'on::ready'
    | 'on::reload'
    | 'on::core::started'
    | 'on::core::stopped'
    | 'on::before::core::start'
    | 'on::before::core::stop'
    | 'on::tray::update'
  )[]
  tags: string[]
  hasUI: boolean
  group: string
  menus: Record<string, string>
  context: {
    profiles: Recordable
    subscriptions: Recordable
    rulesets: Recordable
    plugins: Recordable
    scheduledtasks: Recordable
  }
  configuration: {
    id: string
    title: string
    description: string
    key: string
    component:
      | 'CheckBox'
      | 'CodeEditor'
      | 'Input'
      | 'InputList'
      | 'KeyValueEditor'
      | 'Radio'
      | 'Select'
      | 'MultipleSelect'
      | 'Switch'
      | 'ColorPicker'
      | ''
    value: any
    options: any[]
  }[]
  disabled: boolean
  status: number // 0: Normal 1: Running 2: Stopped
  // Not Config
  updating?: boolean | undefined
  loading?: boolean | undefined
  running?: boolean | undefined
}

export interface Subscription {
  id: string
  name: string
  upload: number
  download: number
  total: number
  expire: number
  updateTime: number
  type: 'Http' | 'File' | 'Manual'
  url: string
  website: string
  path: string
  include: string
  exclude: string
  includeProtocol: string
  excludeProtocol: string
  proxyPrefix: string
  requestProxyMode: RequestProxyMode
  customProxy: string
  disabled: boolean
  inSecure: boolean
  proxies: { id: string; tag: string; type: string }[]
  requestMethod: RequestMethod
  requestTimeout: number
  header: {
    request: Recordable
    response: Recordable
  }
  script: string
  // Not Config
  updating?: boolean
}

export interface RuleSet {
  id: string
  name: string
  updateTime: number
  disabled: boolean
  type: 'Http' | 'File' | 'Manual'
  format: RuleSetFormat
  path: string
  url: string
  count: number
  // Not Config
  updating?: boolean
}

export interface RulesetHub {
  geosite: string
  geoip: string
  list: { name: string; type: 'geosite' | 'geoip'; description: string; count: number }[]
}

export interface ScheduledTask {
  id: string
  name: string
  type:
    | 'update::subscription'
    | 'update::ruleset'
    | 'update::plugin'
    | 'update::all::subscription'
    | 'update::all::ruleset'
    | 'update::all::plugin'
    | 'run::plugin'
    | 'run::script'
  subscriptions: string[]
  rulesets: string[]
  plugins: string[]
  script: string
  cron: string
  notification: boolean
  disabled: boolean
  lastTime: number
}

export interface CustomActionApi {
  h: typeof VueModule.h
  ref: typeof VueModule.ref
}

export type CustomActionProps = Recordable
export type CustomActionSlot = VueModule.VNode | string | number | boolean
export type CustomActionSlots = Recordable<
  ((api: CustomActionApi) => CustomActionSlot) | CustomActionSlot
>

export interface CustomAction<P = CustomActionProps, S = CustomActionSlots> {
  id?: string
  component: string
  componentProps?: P | ((api: CustomActionApi) => P)
  componentSlots?: S | ((api: CustomActionApi) => S)
}

export type CustomActionFn = ((api: CustomActionApi) => CustomAction) & {
  id?: string
}

export type LogLevel = 'trace' | 'debug' | 'info' | 'warn' | 'error' | 'fatal' | 'panic'
export type ClashMode = 'global' | 'rule' | 'direct'
export type InboundType = 'direct' | 'mixed' | 'socks' | 'http' | 'tun'
export interface InboundListen {
  listen: string
  listen_port: number
  tcp_fast_open: boolean
  tcp_multi_path: boolean
  udp_fragment: boolean
}
export type OutboundType = 'direct' | 'block' | 'selector' | 'urltest'
export type TunStack = 'system' | 'gvisor' | 'mixed'
export type Network = 'tcp' | 'udp'
export type RuleSetType = 'inline' | 'local' | 'remote'
export type RuleSetFormat = 'source' | 'binary'
export type RuleType =
  | 'inbound'
  | 'network'
  | 'protocol'
  | 'domain'
  | 'domain_suffix'
  | 'domain_keyword'
  | 'domain_regex'
  | 'source_ip_cidr'
  | 'ip_cidr'
  | 'ip_is_private'
  | 'source_port'
  | 'source_port_range'
  | 'port'
  | 'port_range'
  | 'process_name'
  | 'process_path'
  | 'process_path_regex'
  | 'clash_mode'
  | 'rule_set'
  | 'ip_accept_any'
  | 'outbound'
  | 'inline'
  | 'InsertionPoint'
export type Strategy = 'default' | 'prefer_ipv4' | 'prefer_ipv6' | 'ipv4_only' | 'ipv6_only'
export type DnsServer =
  | 'local'
  | 'hosts'
  | 'tcp'
  | 'udp'
  | 'tls'
  | 'quic'
  | 'https'
  | 'h3'
  | 'dhcp'
  | 'fakeip'
  | 'tailscale'
export type RuleAction = 'route' | 'route-options' | 'reject' | 'hijack-dns' | 'sniff' | 'resolve'
export type DnsRuleAction = 'route' | 'route-options' | 'reject' | 'predefined'
export type RuleActionReject = 'default' | 'drop' | 'reply'
export type Sniffer =
  | 'http'
  | 'tls'
  | 'quic'
  | 'stun'
  | 'dns'
  | 'bittorrent'
  | 'dtls'
  | 'ssh'
  | 'rdp'
  | 'ntp'

export interface Log {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}

export interface Experimental {
  clash_api: {
    external_controller: string
    external_ui: string
    external_ui_download_url: string
    external_ui_download_detour: string
    secret: string
    default_mode: string
    access_control_allow_origin: string[]
    access_control_allow_private_network: boolean
  }
  cache_file: {
    enabled: boolean
    path: string
    cache_id: string
    store_fakeip: boolean
    store_rdrc: boolean
    rdrc_timeout: string
  }
}

export interface Proxy {
  id: string
  type: string
  tag: string
}

export interface ProfileRuleSet {
  id: string
  type: RuleSetType
  tag: string
  // inline
  rules: string
  // local
  path: string
  // remote
  url: string
  download_detour: string
  update_interval: string
  // local or remote
  format: RuleSetFormat
}

export interface Inbound {
  id: string
  type: InboundType
  tag: string
  enable: boolean
  direct?: {
    listen: InboundListen
    network: Network | ''
  }
  mixed?: {
    listen: InboundListen
    users: string[]
  }
  socks?: {
    listen: InboundListen
    users: string[]
  }
  http?: {
    listen: InboundListen
    users: string[]
  }
  tun?: {
    interface_name: string
    address: string[]
    mtu: number
    auto_route: boolean
    strict_route: boolean
    route_address: string[]
    route_exclude_address: string[]
    endpoint_independent_nat: boolean
    stack: TunStack
  }
}

export interface Outbound {
  id: string
  tag: string
  type: OutboundType
  outbounds: Proxy[]
  url: string
  interval: string
  tolerance: number
  interrupt_exist_connections: boolean
  // gui
  include: string
  exclude: string
  icon: string
  hidden: boolean
}

export interface Rule {
  id: string
  type: RuleType
  enable: boolean
  payload: string
  invert: boolean
  action: RuleAction
  // action = route
  outbound: string
  // action = sniff
  sniffer: string[]
  // action = resolve
  strategy: Strategy
  server: string
}

export interface Route {
  rules: Rule[]
  rule_set: ProfileRuleSet[]
  final: string
  auto_detect_interface: boolean
  default_interface: string
  find_process: boolean
  default_domain_resolver: {
    server: string
    client_subnet: string
  }
}

export interface DnsServerConfig {
  id: string
  tag: string
  type: DnsServer
  // [local,tcp,udp,tls,quic,https/h3,dhcp]
  detour: string
  domain_resolver: string
  // hosts
  hosts_path: string[]
  predefined: Recordable
  // [tcp,udp,tls,quic/https,h3]
  server: string
  server_port: string
  // [https,h3]
  path: string
  // dhcp
  interface: string
  // fakeip
  inet4_range: string
  inet6_range: string
}

export interface DnsRule {
  id: string
  type: RuleType
  enable: boolean
  payload: string
  action: DnsRuleAction
  invert: boolean
  // route
  server: string
  strategy: Strategy
  // route/route-options
  disable_cache: boolean
  client_subnet: string
}

export interface Dns {
  servers: DnsServerConfig[]
  rules: DnsRule[]
  disable_cache: boolean
  disable_expire: boolean
  independent_cache: boolean
  client_subnet: string
  final: string
  strategy: Strategy
}

export type MixinPriority = 'mixin' | 'gui'

export interface Mixin {
  priority: MixinPriority
  format: 'json' | 'yaml'
  config: string
}

export interface Script {
  code: string
}

export interface Profile {
  id: string
  name: string
  log: Log
  experimental: Experimental
  inbounds: Inbound[]
  outbounds: Outbound[]
  route: Route
  dns: Dns
  mixin: Mixin
  script: Script
}
