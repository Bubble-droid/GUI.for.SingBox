import type {
  Certificate,
  CertificateProvider,
  CertificateProviderOf,
  Endpoint,
  EndpointOf,
  HttpClient,
  Inbound,
  InboundOf,
  Log,
  NetworkNamespace,
  Outbound,
} from '@profile/types/sing-box/config'
import type { DnsAction, DnsActionOf, DnsServer } from '@profile/types/sing-box/dns'
import type {
  RuleSetOf,
  RouteDefaultRule,
  RuleSet,
  RouteAction,
  RouteActionOf,
} from '@profile/types/sing-box/route'
import type {
  DialerOptions,
  Dns01ChallengeOptions,
  DomainResolverOptions,
  InboundTlsOptions,
  OutboundTlsOptions,
} from '@profile/types/sing-box/shared'

import type { Recordable } from '@/types/typescript'
import type { ValueOf } from '@/types/utils'

export const LogLevel = {
  Trace: 'trace',
  Debug: 'debug',
  Info: 'info',
  Warn: 'warn',
  Error: 'error',
  Fatal: 'fatal',
  Panic: 'panic',
} as const satisfies Recordable<Log['level']>

export type LogLevel = ValueOf<typeof LogLevel>

export const ClashMode = {
  Global: 'global',
  Rule: 'rule',
  Direct: 'direct',
} as const

export type ClashMode = ValueOf<typeof ClashMode>

export const CertStore = {
  System: 'system',
  Mozilla: 'mozilla',
  Chrome: 'chrome',
  None: 'none',
} as const satisfies Recordable<NonNullable<Certificate['store']>>

export type CertStore = ValueOf<typeof CertStore>

export const CertProviderType = {
  Acme: 'acme',
  Tailscale: 'tailscale',
  Cloudflare: 'cloudflare-origin-ca',
} as const satisfies Recordable<CertificateProvider['type']>

export type CertProviderType = ValueOf<typeof CertProviderType>

export const AcmeKeyType = {
  Ed25519: 'ed25519',
  P256: 'p256',
  P384: 'p384',
  Rsa2048: 'rsa2048',
  Rsa4096: 'rsa4096',
} as const satisfies Recordable<CertificateProviderOf<typeof CertProviderType.Acme>['key_type']>

export type AcmeKeyType = ValueOf<typeof AcmeKeyType>

export const CloudflareRequestType = {
  OriginRsa: 'origin-rsa',
  OriginEcc: 'origin-ecc',
} as const satisfies Recordable<
  CertificateProviderOf<typeof CertProviderType.Cloudflare>['request_type']
>

export type CloudflareRequestType = ValueOf<typeof CloudflareRequestType>

export const CloudflareValidity = {
  Days7: 7,
  Days30: 30,
  Days90: 90,
  Days365: 365,
  Days730: 730,
  Days1095: 1095,
  Days5475: 5475,
} as const satisfies Recordable<
  CertificateProviderOf<typeof CertProviderType.Cloudflare>['requested_validity']
>

export type CloudflareValidity = ValueOf<typeof CloudflareValidity>

export const Dns01Provider = {
  AliDns: 'alidns',
  Cloudflare: 'cloudflare',
  AcmeDns: 'acmedns',
} as const satisfies Recordable<Dns01ChallengeOptions['provider']>

export type Dns01Provider = ValueOf<typeof Dns01Provider>

export const AcmeProvider = {
  LetsEncrypt: 'letsencrypt',
  ZeroSSL: 'zerossl',
  Custom: 'custom',
} as const satisfies Recordable<CertificateProviderOf<typeof CertProviderType.Acme>['provider']>

export type AcmeProvider = ValueOf<typeof AcmeProvider>

export const HttpEngine = {
  Go: 'go',
  Apple: 'apple',
} as const satisfies Recordable<HttpClient['engine']>

export type HttpEngine = ValueOf<typeof HttpEngine>

export const HttpVersion = {
  V1: 1,
  V2: 2,
  V3: 3,
} as const satisfies Recordable<HttpClient['version']>

export type HttpVersion = ValueOf<typeof HttpVersion>

export const NetnsType = {
  Default: 'default',
  Unshare: 'unshare',
} as const satisfies Recordable<NetworkNamespace['type']>

export type NetnsType = ValueOf<typeof NetnsType>

export const EndpointType = {
  WireGuard: 'wireguard',
  Tailscale: 'tailscale',
  OpenConnect: 'openconnect',
  OpenVpnClient: 'openvpn-client',
  OpenVpnServer: 'openvpn-server',
} as const satisfies Recordable<Endpoint['type'] | 'openconnect'>

export type EndpointType = ValueOf<typeof EndpointType>

export const InboundType = {
  Direct: 'direct',
  Mixed: 'mixed',
  Socks: 'socks',
  Http: 'http',
  Tun: 'tun',
} as const satisfies Recordable<Inbound['type']>

export type InboundType = ValueOf<typeof InboundType>

export const TunStack = {
  System: 'system',
  GVisor: 'gvisor',
  Mixed: 'mixed',
} as const satisfies Recordable<InboundOf<'tun'>['stack']>

export type TunStack = ValueOf<typeof TunStack>

export const OutboundType = {
  Direct: 'direct',
  Block: 'block',
  Selector: 'selector',
  UrlTest: 'urltest',
} as const satisfies Recordable<Outbound['type']>

export type OutboundType = ValueOf<typeof OutboundType>

export const Network = {
  Tcp: 'tcp',
  Udp: 'udp',
} as const satisfies Recordable<InboundOf<'direct'>['network']>

export type Network = ValueOf<typeof Network>

export const RuleSetType = {
  Inline: 'inline',
  Local: 'local',
  Remote: 'remote',
} as const satisfies Recordable<RuleSet['type']>

export type RuleSetType = ValueOf<typeof RuleSetType>

export const RuleSetFormat = {
  Source: 'source',
  Binary: 'binary',
} as const satisfies Recordable<RuleSetOf<'local'>['format']>

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
  PreferIpv4: 'prefer_ipv4',
  PreferIpv6: 'prefer_ipv6',
  Ipv4Only: 'ipv4_only',
  Ipv6Only: 'ipv6_only',
} as const satisfies Recordable<Extract<DomainResolverOptions, object>['strategy']>

export type DomainStrategy = ValueOf<typeof DomainStrategy>

export const DnsServerType = {
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
} as const satisfies Recordable<DnsServer['type']>

export type DnsServerType = ValueOf<typeof DnsServerType>

export const CommonActionKind = {
  Route: 'route',
  RouteOptions: 'route-options',
  Reject: 'reject',
} as const satisfies Recordable<Extract<RouteAction['action'], DnsAction['action']>>

export const RouteActionKind = {
  ...CommonActionKind,
  HijackDns: 'hijack-dns',
  Sniff: 'sniff',
  Resolve: 'resolve',
} as const satisfies Recordable<RouteAction['action']>

export type RouteActionKind = ValueOf<typeof RouteActionKind>

export const DnsActionKind = {
  ...CommonActionKind,
  Predefined: 'predefined',
} as const satisfies Recordable<DnsAction['action']>

export type DnsActionKind = ValueOf<typeof DnsActionKind>

export const DnsRejectMethod = {
  Default: 'default',
  Drop: 'drop',
} as const satisfies Recordable<DnsActionOf<'reject'>['method']>

export type DnsRejectMethod = ValueOf<typeof DnsRejectMethod>

export const RouteRejectMethod = {
  ...DnsRejectMethod,
  Reply: 'reply',
} as const satisfies Recordable<RouteActionOf<'reject'>['method']>

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
} as const satisfies Recordable<RouteDefaultRule['protocol']>

export type SniffProtocol = ValueOf<typeof SniffProtocol>

export const NetworkType = {
  Wifi: 'wifi',
  Cellular: 'cellular',
  Ethernet: 'ethernet',
  Other: 'other',
} as const satisfies Recordable<DialerOptions['network_type']>

export type NetworkType = ValueOf<typeof NetworkType>

export const NetworkStrategy = {
  Default: 'default',
  Fallback: 'fallback',
  Hybrid: 'hybrid',
} as const satisfies Recordable<DialerOptions['network_strategy']>

export type NetworkStrategy = ValueOf<typeof NetworkStrategy>

export const UdpNatBehavior = {
  EndpointIndependent: 'endpoint_independent',
  AddressDependent: 'address_dependent',
  AddressAndPortDependent: 'address_and_port_dependent',
} as const satisfies Recordable<EndpointOf<'wireguard'>['udp_mapping']>

export type UdpNatBehavior = ValueOf<typeof UdpNatBehavior>

export const OpenConnectFlavor = {
  AnyConnect: 'anyconnect',
  Gp: 'gp',
  Fortinet: 'fortinet',
  F5: 'f5',
  Pulse: 'pulse',
  Nc: 'nc',
} as const

export type OpenConnectFlavor = ValueOf<typeof OpenConnectFlavor>

export const OpenConnectTokenMode = {
  Totp: 'totp',
  Hotp: 'hotp',
  Stoken: 'stoken',
  Oidc: 'oidc',
} as const

export type OpenConnectTokenMode = ValueOf<typeof OpenConnectTokenMode>

export const OpenConnectReportedOs = {
  Linux: 'linux',
  Linux64: 'linux-64',
  Win: 'win',
  MacIntel: 'mac-intel',
  Android: 'android',
  AppleIos: 'apple-ios',
} as const

export type OpenConnectReportedOs = ValueOf<typeof OpenConnectReportedOs>

export const OpenConnectCompressionMode = {
  Stateless: 'stateless',
  All: 'all',
} as const

export type OpenConnectCompressionMode = ValueOf<typeof OpenConnectCompressionMode>

export const OpenVpnMode = {
  Tls: 'tls',
  StaticKey: 'static_key',
} as const

export type OpenVpnMode = ValueOf<typeof OpenVpnMode>

export const OpenVpnTopology = {
  Subnet: 'subnet',
  P2p: 'p2p',
  Net30: 'net30',
} as const

export type OpenVpnTopology = ValueOf<typeof OpenVpnTopology>

export const OpenVpnAuthRetry = {
  None: 'none',
  Nointeract: 'nointeract',
  Interact: 'interact',
} as const

export type OpenVpnAuthRetry = ValueOf<typeof OpenVpnAuthRetry>

export const OpenVpnKeyDirection = {
  Server: 'server',
  Client: 'client',
} as const

export type OpenVpnKeyDirection = ValueOf<typeof OpenVpnKeyDirection>

export const OpenVpnCertNameType = {
  Name: 'name',
  Subject: 'subject',
  NamePrefix: 'name-prefix',
} as const

export type OpenVpnCertNameType = ValueOf<typeof OpenVpnCertNameType>

export const OpenVpnRemoteCertTls = {
  Server: 'server',
  Client: 'client',
  None: 'none',
} as const

export type OpenVpnRemoteCertTls = ValueOf<typeof OpenVpnRemoteCertTls>

export const OpenVpnCertProfile = {
  Legacy: 'legacy',
  Insecure: 'insecure',
  Preferred: 'preferred',
  Suiteb: 'suiteb',
} as const

export type OpenVpnCertProfile = ValueOf<typeof OpenVpnCertProfile>

export const OpenVpnNsCertType = {
  Server: 'server',
  Client: 'client',
} as const

export type OpenVpnNsCertType = ValueOf<typeof OpenVpnNsCertType>

export const OpenVpnControlWrapType = {
  TlsCrypt: 'tls_crypt',
  TlsAuth: 'tls_auth',
  TlsCryptV2: 'tls_crypt_v2',
} as const

export type OpenVpnControlWrapType = ValueOf<typeof OpenVpnControlWrapType>

export const OpenVpnMssFixMode = {
  Mtu: 'mtu',
  Fixed: 'fixed',
} as const

export type OpenVpnMssFixMode = ValueOf<typeof OpenVpnMssFixMode>

export const OpenVpnCompression = {
  Disabled: 'disabled',
  None: 'none',
  No: 'no',
  Lz4: 'lz4',
  Lz4V2: 'lz4-v2',
  Stub: 'stub',
  StubV2: 'stub-v2',
  Off: 'off',
} as const

export type OpenVpnCompression = ValueOf<typeof OpenVpnCompression>

export const OpenVpnCompressionLzo = {
  Disabled: 'disabled',
  None: 'none',
  No: 'no',
  Yes: 'yes',
  Adaptive: 'adaptive',
  Asym: 'asym',
  Off: 'off',
} as const

export type OpenVpnCompressionLzo = ValueOf<typeof OpenVpnCompressionLzo>

export const OpenVpnAllowCompression = {
  No: 'no',
  Asym: 'asym',
  Yes: 'yes',
} as const

export type OpenVpnAllowCompression = ValueOf<typeof OpenVpnAllowCompression>

export const OpenVpnPullFilterAction = {
  Ignore: 'ignore',
  Accept: 'accept',
  Reject: 'reject',
} as const

export type OpenVpnPullFilterAction = ValueOf<typeof OpenVpnPullFilterAction>

export const OpenVpnVerifyClientCert = {
  Require: 'require',
  Optional: 'optional',
  None: 'none',
} as const

export type OpenVpnVerifyClientCert = ValueOf<typeof OpenVpnVerifyClientCert>

export const OpenVpnDnsSec = {
  Yes: 'yes',
  Optional: 'optional',
  No: 'no',
} as const

export type OpenVpnDnsSec = ValueOf<typeof OpenVpnDnsSec>

export const OpenVpnDnsTransport = {
  Plain: 'plain',
  Dot: 'dot',
  Doh: 'doh',
} as const

export type OpenVpnDnsTransport = ValueOf<typeof OpenVpnDnsTransport>

export const TlsEngine = {
  Go: 'go',
  Apple: 'apple',
  Windows: 'windows',
} as const satisfies Recordable<OutboundTlsOptions['engine']>

export type TlsEngine = ValueOf<typeof TlsEngine>

export const TlsVersion = {
  V1_0: '1.0',
  V1_1: '1.1',
  V1_2: '1.2',
  V1_3: '1.3',
} as const satisfies Recordable<OutboundTlsOptions['max_version']>

export type TlsVersion = ValueOf<typeof TlsVersion>

export const TlsCipherSuite = {
  TLS_RSA_WITH_AES_128_CBC_SHA: 'TLS_RSA_WITH_AES_128_CBC_SHA',
  TLS_RSA_WITH_AES_256_CBC_SHA: 'TLS_RSA_WITH_AES_256_CBC_SHA',
  TLS_RSA_WITH_AES_128_GCM_SHA256: 'TLS_RSA_WITH_AES_128_GCM_SHA256',
  TLS_RSA_WITH_AES_256_GCM_SHA384: 'TLS_RSA_WITH_AES_256_GCM_SHA384',
  TLS_AES_128_GCM_SHA256: 'TLS_AES_128_GCM_SHA256',
  TLS_AES_256_GCM_SHA384: 'TLS_AES_256_GCM_SHA384',
  TLS_CHACHA20_POLY1305_SHA256: 'TLS_CHACHA20_POLY1305_SHA256',
  TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA: 'TLS_ECDHE_ECDSA_WITH_AES_128_CBC_SHA',
  TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA: 'TLS_ECDHE_ECDSA_WITH_AES_256_CBC_SHA',
  TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA: 'TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA',
  TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA: 'TLS_ECDHE_RSA_WITH_AES_256_CBC_SHA',
  TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256: 'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
  TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384: 'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
  TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256: 'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
  TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384: 'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
  TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256: 'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
  TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256: 'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256',
} as const satisfies Recordable<OutboundTlsOptions['cipher_suites']>

export type TlsCipherSuite = ValueOf<typeof TlsCipherSuite>

export const TlsCurvePreference = {
  P256: 'P256',
  P384: 'P384',
  P521: 'P521',
  X25519: 'X25519',
  X25519MLKEM768: 'X25519MLKEM768',
} as const satisfies Recordable<OutboundTlsOptions['curve_preferences']>

export type TlsCurvePreference = ValueOf<typeof TlsCurvePreference>

export const TlsClientAuthentication = {
  No: 'no',
  Request: 'request',
  RequireAny: 'require-any',
  VerifyIfGiven: 'verify-if-given',
  RequireAndVerify: 'require-and-verify',
} as const satisfies Recordable<InboundTlsOptions['client_authentication']>

export type TlsClientAuthentication = ValueOf<typeof TlsClientAuthentication>

export const TlsSpoofMethod = {
  WrongSequence: 'wrong-sequence',
  WrongChecksum: 'wrong-checksum',
  WrongAck: 'wrong-ack',
  WrongMd5: 'wrong-md5',
  WrongTimestamp: 'wrong-timestamp',
} as const satisfies Recordable<OutboundTlsOptions['spoof_method']>

export type TlsSpoofMethod = ValueOf<typeof TlsSpoofMethod>

export const UtlsFingerprint = {
  Chrome: 'chrome',
  Firefox: 'firefox',
  Edge: 'edge',
  Safari: 'safari',
  360: '360',
  Qq: 'qq',
  Ios: 'ios',
  Android: 'android',
  Random: 'random',
  Randomized: 'randomized',
} as const satisfies Recordable<NonNullable<OutboundTlsOptions['utls']>['fingerprint']>

export type UtlsFingerprint = ValueOf<typeof UtlsFingerprint>
