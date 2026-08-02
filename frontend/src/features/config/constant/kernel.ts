import type {
  SingBoxDialer,
  SingBoxDomainResolver,
  SingBoxEndpoint,
  SingBoxEndpointOf,
  SingBoxLogConfig,
} from '@/features/config/types'
import type { ValueOf } from '@/features/types'

export const LogLevel = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
  Panic: 'panic',
} as const satisfies Recordable<SingBoxLogConfig['level']>

export type LogLevel = ValueOf<typeof LogLevel>

export const ClashMode = {
  Global: 'global',
  Rule: 'rule',
  Direct: 'direct',
} as const

export type ClashMode = ValueOf<typeof ClashMode>

export const Endpoint = {
  WireGuard: 'wireguard',
  Tailscale: 'tailscale',
  OpenConnect: 'openconnect',
  OpenVpnClient: 'openvpn-client',
  OpenVpnServer: 'openvpn-server',
} as const satisfies Recordable<SingBoxEndpoint['type'] | 'openconnect'>

export type Endpoint = ValueOf<typeof Endpoint>

export const Inbound = {
  Direct: 'direct',
  Mixed: 'mixed',
  Socks: 'socks',
  Http: 'http',
  Tun: 'tun',
} as const

export type Inbound = ValueOf<typeof Inbound>

export const Outbound = {
  Direct: 'direct',
  Block: 'block',
  Selector: 'selector',
  UrlTest: 'urltest',
} as const

export type Outbound = ValueOf<typeof Outbound>

export const TunStack = {
  System: 'system',
  GVisor: 'gvisor',
  Mixed: 'mixed',
} as const

export type TunStack = ValueOf<typeof TunStack>

export const Network = {
  Tcp: 'tcp',
  Udp: 'udp',
} as const

export type Network = ValueOf<typeof Network>

export const RuleSetType = {
  Inline: 'inline',
  Local: 'local',
  Remote: 'remote',
} as const

export type RuleSetType = ValueOf<typeof RuleSetType>

export const RuleSetFormat = {
  Source: 'source',
  Binary: 'binary',
} as const

export type RuleSetFormat = ValueOf<typeof RuleSetFormat>

export const CommonRuleType = {
  Inbound: 'inbound',
  Network: 'network',
  Protocol: 'protocol',
  Domain: 'domain',
  DomainSuffix: 'domain_suffix',
  DomainKeyword: 'domain_keyword',
  DomainRegex: 'domain_regex',
  SourceIPCidr: 'source_ip_cidr',
  IpCidr: 'ip_cidr',
  IpIsPrivate: 'ip_is_private',
  SourcePort: 'source_port',
  SourcePortRange: 'source_port_range',
  Port: 'port',
  PortRange: 'port_range',
  ProcessName: 'process_name',
  ProcessPath: 'process_path',
  ProcessPathRegex: 'process_path_regex',
  ClashMode: 'clash_mode',
  RuleSet: 'rule_set',
  // GUI
  Inline: 'inline',
  InsertionPoint: 'InsertionPoint',
} as const

export const RouteRuleType = {
  ...CommonRuleType,
} as const

export type RouteRuleType = ValueOf<typeof RouteRuleType>

export const DnsRuleType = {
  ...CommonRuleType,
  IpAcceptAny: 'ip_accept_any',
} as const

export type DnsRuleType = ValueOf<typeof DnsRuleType>

export const DomainStrategy = {
  Default: 'default',
  PreferIpv4: 'prefer_ipv4',
  PreferIpv6: 'prefer_ipv6',
  Ipv4Only: 'ipv4_only',
  Ipv6Only: 'ipv6_only',
} as const satisfies Recordable<SingBoxDomainResolver['strategy'] | 'default'>

export type DomainStrategy = ValueOf<typeof DomainStrategy>

export const DnsServer = {
  Local: 'local',
  Hosts: 'hosts',
  Tcp: 'tcp',
  Udp: 'udp',
  Tls: 'tls',
  Https: 'https',
  Quic: 'quic',
  H3: 'h3',
  Dhcp: 'dhcp',
  FakeIp: 'fakeip',
} as const

export type DnsServer = ValueOf<typeof DnsServer>

export const CommonRuleAction = {
  Route: 'route',
  RouteOptions: 'route-options',
  Reject: 'reject',
} as const

export const RouteRuleAction = {
  ...CommonRuleAction,
  HijackDns: 'hijack-dns',
  Sniff: 'sniff',
  Resolve: 'resolve',
} as const

export type RouteRuleAction = ValueOf<typeof RouteRuleAction>

export const DnsRuleAction = {
  ...CommonRuleAction,
  Predefined: 'predefined',
} as const

export type DnsRuleAction = ValueOf<typeof DnsRuleAction>

export const DnsRejectMethod = {
  Default: 'default',
  Drop: 'drop',
} as const

export type DnsRejectMethod = ValueOf<typeof DnsRejectMethod>

export const RouteRejectMethod = {
  ...DnsRejectMethod,
  Reply: 'reply',
} as const

export type RouteRejectMethod = ValueOf<typeof RouteRejectMethod>

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
} as const

export type SniffProtocol = ValueOf<typeof SniffProtocol>

export const NetworkType = {
  Wifi: 'wifi',
  Cellular: 'cellular',
  Ethernet: 'ethernet',
  Other: 'other',
} as const satisfies Recordable<SingBoxDialer['network_type']>

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
} as const satisfies Recordable<SingBoxDialer['network_strategy']>

export type NetworkStrategy = ValueOf<typeof NetworkStrategy>

export const UdpNatBehavior = {
  EndpointIndependent: 'endpoint_independent',
  AddressDependent: 'address_dependent',
  AddressAndPortDependent: 'address_and_port_dependent',
} as const satisfies Recordable<SingBoxEndpointOf<'wireguard'>['udp_mapping']>

export type UdpNatBehavior = ValueOf<typeof UdpNatBehavior>
