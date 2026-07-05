export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
  Panic = 'panic',
}

export enum ClashMode {
  Global = 'global',
  Rule = 'rule',
  Direct = 'direct',
}

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
  Urltest: 'urltest',
} as const

export type Outbound = ValueOf<typeof Outbound>

export enum TunStack {
  System = 'system',
  GVisor = 'gvisor',
  Mixed = 'mixed',
}

export const Network = {
  Tcp: 'tcp',
  Udp: 'udp',
} as const

export type Network = ValueOf<typeof Network>

export enum RulesetType {
  Inline = 'inline',
  Local = 'local',
  Remote = 'remote',
}

export enum RulesetFormat {
  Source = 'source',
  Binary = 'binary',
}

export enum RuleType {
  Inbound = 'inbound',
  Network = 'network',
  Protocol = 'protocol',
  Domain = 'domain',
  DomainSuffix = 'domain_suffix',
  DomainKeyword = 'domain_keyword',
  DomainRegex = 'domain_regex',
  SourceIPCidr = 'source_ip_cidr',
  IPCidr = 'ip_cidr',
  IpIsPrivate = 'ip_is_private',
  SourcePort = 'source_port',
  SourcePortRange = 'source_port_range',
  Port = 'port',
  PortRange = 'port_range',
  ProcessName = 'process_name',
  ProcessPath = 'process_path',
  ProcessPathRegex = 'process_path_regex',
  ClashMode = 'clash_mode',
  RuleSet = 'rule_set',
  IpAcceptAny = 'ip_accept_any',
  // GUI
  Inline = 'inline',
  InsertionPoint = 'InsertionPoint',
}

export enum Strategy {
  Default = 'default',
  PreferIPv4 = 'prefer_ipv4',
  PreferIPv6 = 'prefer_ipv6',
  IPv4Only = 'ipv4_only',
  IPv6Only = 'ipv6_only',
}

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
  FakeIP: 'fakeip',
} as const

export type DnsServer = ValueOf<typeof DnsServer>

export enum RuleAction {
  Route = 'route',
  RouteOptions = 'route-options',
  Reject = 'reject',
  HijackDNS = 'hijack-dns',
  Sniff = 'sniff',
  Resolve = 'resolve',
  Predefined = 'predefined',
}

export enum RuleActionReject {
  Default = 'default',
  Drop = 'drop',
  Reply = 'reply',
}

export enum Sniffer {
  Http = 'http',
  Tls = 'tls',
  Quic = 'quic',
  Stun = 'stun',
  Dns = 'dns',
  Bittorrent = 'bittorrent',
  Dtls = 'dtls',
  Ssh = 'ssh',
  Rdp = 'rdp',
  Ntp = 'ntp',
}
