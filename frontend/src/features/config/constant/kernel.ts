import type { ValueOf } from '@/features/types'

export const LogLevel = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
  Panic: 'panic',
} as const

export type LogLevel = ValueOf<typeof LogLevel>

export const ClashMode = {
  Global: 'global',
  Rule: 'rule',
  Direct: 'direct',
} as const

export type ClashMode = ValueOf<typeof ClashMode>

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

export const RuleType = {
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
  IpAcceptAny: 'ip_accept_any',
  // GUI
  Inline: 'inline',
  InsertionPoint: 'InsertionPoint',
} as const

export type RuleType = ValueOf<typeof RuleType>

export const DomainStrategy = {
  Default: 'default',
  PreferIpv4: 'prefer_ipv4',
  PreferIpv6: 'prefer_ipv6',
  Ipv4Only: 'ipv4_only',
  Ipv6Only: 'ipv6_only',
} as const

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

export const RuleAction = {
  Route: 'route',
  RouteOptions: 'route-options',
  Reject: 'reject',
  HijackDns: 'hijack-dns',
  Sniff: 'sniff',
  Resolve: 'resolve',
  Predefined: 'predefined',
} as const

export type RuleAction = ValueOf<typeof RuleAction>

export const RuleActionReject = {
  Default: 'default',
  Drop: 'drop',
  Reply: 'reply',
} as const

export type RuleActionReject = ValueOf<typeof RuleActionReject>

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
