import type {
  CoreDnsAction,
  CoreDnsActionOf,
  CoreDnsConfig,
  CoreDnsDefaultRule,
  CoreDnsServerConfig,
  CoreEndpointConfig,
  CoreInboundConfig,
  CoreInboundOf,
  CoreLogConfig,
  CoreOutboundConfig,
  CoreOutboundOf,
  CoreRouteAction,
  CoreRouteActionOf,
  CoreRouteDefaultRule,
  CoreRouteLogicalRule,
  CoreRuleSetConfig,
  CoreRuleSetOf,
  CoreServiceConfig,
} from '@/types'
import type { Recordable, UnpackArray, ValueOf } from '@/types/utils'

export const LogLevel = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
  Panic: 'panic',
} as const satisfies Recordable<CoreLogConfig['level']>

export type LogLevel = ValueOf<typeof LogLevel>

export const ClashMode = {
  Global: 'global',
  Rule: 'rule',
  Direct: 'direct',
  Custom: 'custom',
} as const

export type ClashMode = ValueOf<typeof ClashMode>

export const Endpoint = {
  Wireguard: 'wireguard',
  Tailscale: 'tailscale',
  OpenvpnClient: 'openvpn-client',
  OpenvpnServer: 'openvpn-server',
  Openconnect: 'openconnect',
} as const satisfies Recordable<CoreEndpointConfig['type'] | 'openconnect'>

export type Endpoint = ValueOf<typeof Endpoint>

export const Inbound = {
  Direct: 'direct',
  Mixed: 'mixed',
  Socks: 'socks',
  Http: 'http',
  Shadowsocks: 'shadowsocks',
  Vmess: 'vmess',
  Trojan: 'trojan',
  Naive: 'naive',
  Hysteria: 'hysteria',
  ShadowTls: 'shadowtls',
  Vless: 'vless',
  Tuic: 'tuic',
  Hysteria2: 'hysteria2',
  AnyTls: 'anytls',
  Snell: 'snell',
  Tun: 'tun',
  Redirect: 'redirect',
  Tproxy: 'tproxy',
  Cloudflared: 'cloudflared',
} as const satisfies Recordable<CoreInboundConfig['type']>

export type Inbound = ValueOf<typeof Inbound>

export const TunDnsMode = {
  Disabled: 'disabled',
  Native: 'native',
  Hijack: 'hijack',
} as const satisfies Recordable<CoreInboundOf<'tun'>['dns_mode']>

export type TunDnsMode = ValueOf<typeof TunDnsMode>

export const TunStack = {
  System: 'system',
  GVisor: 'gvisor',
  Mixed: 'mixed',
} as const satisfies Recordable<CoreInboundOf<'tun'>['stack']>

export type TunStack = ValueOf<typeof TunStack>

export const Outbound = {
  Direct: 'direct',
  Bridge: 'bridge',
  Block: 'block',
  Selector: 'selector',
  Urltest: 'urltest',
} as const satisfies Recordable<CoreOutboundConfig['type'] | 'bridge'>

export type Outbound = ValueOf<typeof Outbound>

export const OutboundMember = {
  BuiltIn: 'built-in',
  Endpoint: 'endpoint',
  Subscription: 'subscription',
  Proxy: 'proxy',
} as const

export type OutboundMember = ValueOf<typeof OutboundMember>

export const Network = {
  Tcp: 'tcp',
  Udp: 'udp',
  Icmp: 'icmp',
} as const satisfies Recordable<CoreInboundOf<'direct'>['network']>

export type Network = ValueOf<typeof Network>

export const RuleSetType = {
  Inline: 'inline',
  Local: 'local',
  Remote: 'remote',
} as const satisfies Recordable<CoreRuleSetConfig['type']>

export type RuleSetType = ValueOf<typeof RuleSetType>

export const RuleSetFormat = {
  Source: 'source',
  Binary: 'binary',
} as const satisfies Recordable<CoreRuleSetOf<'local'>['format']>

export type RuleSetFormat = ValueOf<typeof RuleSetFormat>

export const RuleType = {
  Default: 'default',
  Logical: 'logical',
  Inline: 'inline',
} as const

export type RuleType = ValueOf<typeof RuleType>

export const CommonRuleType = {
  Invert: 'invert',
  Protocol: 'protocol',
  Domain: 'domain',
  DomainSuffix: 'domain_suffix',
  DomainKeyword: 'domain_keyword',
  DomainRegex: 'domain_regex',
  SourceIpCidr: 'source_ip_cidr',
  IpCidr: 'ip_cidr',
  SourcePort: 'source_port',
  SourcePortRange: 'source_port_range',
  Port: 'port',
  PortRange: 'port_range',
  ProcessName: 'process_name',
  ProcessPath: 'process_path',
  ProcessPathRegex: 'process_path_regex',
  PackageName: 'package_name',
  PackageNameRegex: 'package_name_regex',
  WifiSsid: 'wifi_ssid',
  WifiBssid: 'wifi_bssid',
  NetworkType: 'network_type',
  NetworkIsExpensive: 'network_is_expensive',
  NetworkIsConstrained: 'network_is_constrained',
  InterfaceAddress: 'interface_address',
  NetworkInterfaceAddress: 'network_interface_address',
  DefaultInterfaceAddress: 'default_interface_address',
  SourceMacAddress: 'source_mac_address',
  SourceHostname: 'source_hostname',
  Inbound: 'inbound',
  IpVersion: 'ip_version',
  AuthUser: 'auth_user',
  IpIsPrivate: 'ip_is_private',
  SourceIpIsPrivate: 'source_ip_is_private',
  User: 'user',
  UserId: 'user_id',
  ClashMode: 'clash_mode',
  RuleSet: 'rule_set',
  RuleSetIpCidrMatchSource: 'rule_set_ip_cidr_match_source',
} as const satisfies Recordable<Extract<keyof CoreDnsDefaultRule, keyof CoreRouteDefaultRule>>

export type CommonRuleType = ValueOf<typeof CommonRuleType>

export const RouteRuleType = {
  ...CommonRuleType,
  Network: 'network',
  Client: 'client',
  PreferredBy: 'preferred_by',
} as const satisfies Recordable<keyof CoreRouteDefaultRule>

export type RouteRuleType = ValueOf<typeof RouteRuleType>

export const DnsRuleType = {
  ...CommonRuleType,
  QueryType: 'query_type',
  Network: 'network',
  PreferredBy: 'preferred_by',
  IpAcceptAny: 'ip_accept_any',
  MatchResponse: 'match_response',
  ResponseRcode: 'response_rcode',
  ResponseAnswer: 'response_answer',
  ResponseNs: 'response_ns',
  ResponseExtra: 'response_extra',
} as const satisfies Recordable<keyof CoreDnsDefaultRule>

export type DnsRuleType = ValueOf<typeof DnsRuleType>

export const DomainStrategy = {
  PreferIpv4: 'prefer_ipv4',
  PreferIpv6: 'prefer_ipv6',
  Ipv4Only: 'ipv4_only',
  Ipv6Only: 'ipv6_only',
} as const satisfies Recordable<CoreDnsConfig['strategy']>

export type DomainStrategy = ValueOf<typeof DomainStrategy>

export const LogicalRuleMode = {
  And: 'and',
  Or: 'or',
} as const satisfies Recordable<CoreRouteLogicalRule['mode']>

export type LogicalRuleMode = ValueOf<typeof LogicalRuleMode>

const CommonRuleAction = {
  Route: 'route',
  RouteOptions: 'route-options',
  Reject: 'reject',
} as const satisfies Recordable<CoreRouteAction['action']>

export const RouteRuleAction = {
  ...CommonRuleAction,
  HijackDns: 'hijack-dns',
  Sniff: 'sniff',
  Resolve: 'resolve',
  Bypass: 'bypass',
} as const satisfies Recordable<CoreRouteAction['action']>

export type RouteRuleAction = ValueOf<typeof RouteRuleAction>

export const DnsRuleAction = {
  ...CommonRuleAction,
  Predefined: 'predefined',
  Respond: 'respond',
  Evaluate: 'evaluate',
} as const satisfies Recordable<CoreDnsAction['action']>

export type DnsRuleAction = ValueOf<typeof DnsRuleAction>

export const DnsRejectMethod = {
  Default: 'default',
  Drop: 'drop',
} as const satisfies Recordable<CoreDnsActionOf<'reject'>['method']>

export type DnsRejectMethod = ValueOf<typeof DnsRejectMethod>

export const RouteRejectMethod = {
  ...DnsRejectMethod,
  Reply: 'reply',
} as const satisfies Recordable<CoreRouteActionOf<'reject'>['method']>

export type RouteRejectMethod = ValueOf<typeof RouteRejectMethod>

export const DnsRcode = {
  NOERROR: 'NOERROR',
  FORMERR: 'FORMERR',
  SERVFAIL: 'SERVFAIL',
  NXDOMAIN: 'NXDOMAIN',
  NOTIMP: 'NOTIMP',
  REFUSED: 'REFUSED',
} as const satisfies Recordable<CoreDnsActionOf<'predefined'>['rcode']>

export type DnsRcode = ValueOf<typeof DnsRcode>

export const DnsServer = {
  Local: 'local',
  Hosts: 'hosts',
  Tcp: 'tcp',
  Udp: 'udp',
  Tls: 'tls',
  Quic: 'quic',
  Https: 'https',
  H3: 'h3',
  Dhcp: 'dhcp',
  FakeIp: 'fakeip',
  Mdns: 'mdns',
  Tailscale: 'tailscale',
  Resolved: 'resolved',
} as const satisfies Recordable<CoreDnsServerConfig['type']>

export type DnsServer = ValueOf<typeof DnsServer>

export const SniffProtocol = {
  Http: 'http',
  Tls: 'tls',
  Quic: 'quic',
  Stun: 'stun',
  Dns: 'dns',
  Bittorrent: 'bittorrent',
  Dtls: 'dtls',
  Ssh: 'ssh',
  Rdp: 'rdp',
  Ntp: 'ntp',
} as const satisfies Recordable<UnpackArray<CoreRouteActionOf<'sniff'>['sniffer']> | 'ntp'>

export type SniffProtocol = ValueOf<typeof SniffProtocol>

export const Service = {
  Resolved: 'resolved',
  Api: 'api',
  Derp: 'derp',
  SsmApi: 'ssm-api',
  Ccm: 'ccm',
  Ocm: 'ocm',
  HysteriaRealm: 'hysteria-realm',
  UsbipServer: 'usbip-server',
  UsbipClient: 'usbip-client',
} as const satisfies Recordable<CoreServiceConfig['type']>

export type Service = ValueOf<typeof Service>

export const IpVersion = {
  Ipv4: '4',
  Ipv6: '6',
} as const

export type IpVersion = ValueOf<typeof IpVersion>

export const QuicClient = {
  Chromium: 'chromium',
  Safari: 'safari',
  Firefox: 'firefox',
  QuicGo: 'quic-go',
} as const satisfies Recordable<CoreRouteDefaultRule['client']>

export type QuicClient = ValueOf<typeof QuicClient>

export const NetworkType = {
  Wifi: 'wifi',
  Cellular: 'cellular',
  Ethernet: 'ethernet',
  Other: 'other',
} as const satisfies Recordable<CoreRouteDefaultRule['network_type']>

export type NetworkType = ValueOf<typeof NetworkType>

export const NetworkStrategy = {
  Default: 'default',
  Fallback: 'fallback',
  Hybrid: 'hybrid',
  Wifi: 'wifi',
  Cellular: 'cellular',
  Ethernet: 'ethernet',
  Wifi_only: 'wifi_only',
  CellularOnly: 'cellular_only',
  EthernetOnly: 'ethernet_only',
} as const satisfies Recordable<CoreOutboundOf<'direct'>['network_strategy']>

export type NetworkStrategy = ValueOf<typeof NetworkStrategy>

export const TlsSpoofMethod = {
  WrongSequence: 'wrong-sequence',
  WrongChecksum: 'wrong-checksum',
  WrongAck: 'wrong-ack',
  WrongMd5: 'wrong-md5',
  WrongTimestamp: 'wrong-timestamp',
} as const

export type TlsSpoofMethod = ValueOf<typeof TlsSpoofMethod>
