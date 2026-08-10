import type { ComponentOption } from '@/types/views'

import {
  ClashMode,
  LogLevel,
  Inbound,
  Outbound,
  RouteRuleType,
  TunStack,
  Network,
  RuleSetType,
  RuleSetFormat,
  DomainStrategy,
  RouteRuleAction,
  RouteRejectMethod,
  DnsServer,
  SniffProtocol,
  DnsRejectMethod,
  DnsRuleAction,
  DnsRuleType,
  NetworkStrategy,
  NetworkType,
  Endpoint,
  UdpNatBehavior,
  OpenConnectCompressionMode,
  OpenConnectFlavor,
  OpenConnectReportedOs,
  OpenConnectTokenMode,
  OpenVpnAllowCompression,
  OpenVpnAuthRetry,
  OpenVpnCertNameType,
  OpenVpnCertProfile,
  OpenVpnCompression,
  OpenVpnCompressionLzo,
  OpenVpnControlWrapType,
  OpenVpnDnsTransport,
  OpenVpnKeyDirection,
  OpenVpnMode,
  OpenVpnMssFixMode,
  OpenVpnNsCertType,
  OpenVpnPullFilterAction,
  OpenVpnRemoteCertTls,
  OpenVpnTopology,
  OpenVpnVerifyClientCert,
  OpenVpnDnsSec,
  TlsVersion,
  NetnsType,
  CertificateStore,
  TlsCipherSuite,
  TlsClientAuthentication,
  TlsCurvePreference,
  TlsEngine,
  TlsSpoofMethod,
  UtlsFingerprint,
  HttpEngine,
  HttpVersion,
  AcmeKeyType,
  AcmeProvider,
  CertificateProviderType,
  CloudflareOriginCaRequestType,
  CloudflareOriginCaValidity,
  Dns01Provider,
} from './kernel'

type FormatString<
  Pattern extends string,
  Val extends string | number,
> = Pattern extends `${infer Start}{{val}}${infer End}` ? `${Start}${Val}${End}` : Pattern

type OptionItem<TValue extends string | number, TLabelPattern extends string> = TValue extends
  | string
  | number
  ? {
      value: TValue
      label: FormatString<TLabelPattern, TValue>
    }
  : never

const defineOptions = <
  const TSource extends Recordable<string | number>,
  const TLabelPattern extends string,
>(
  source: TSource,
  pattern: TLabelPattern,
) => {
  type TValue = TSource[keyof TSource]

  return Object.values(source).map((v) => ({
    value: v,
    label: pattern.replace('{{val}}', String(v)),
  })) as OptionItem<TValue, TLabelPattern>[]
}

export const PredefinedClashModeOptions = [
  {
    label: 'kernel.global',
    value: ClashMode.Global,
    desc: 'kernel.globalDesc',
  },
  {
    label: 'kernel.rule',
    value: ClashMode.Rule,
    desc: 'kernel.ruleDesc',
  },
  {
    label: 'kernel.direct',
    value: ClashMode.Direct,
    desc: 'kernel.directDesc',
  },
]

export const LogLevelOptions = defineOptions(LogLevel, 'kernel.log.level.{{val}}')

export const PredefinedNtpServerOptions = [
  {
    label: 'kernel.ntp.server.aliyun',
    value: 'ntp.aliyun.com',
  },
  {
    label: 'kernel.ntp.server.tencent',
    value: 'ntp.tencent.com',
  },
  {
    label: 'kernel.ntp.server.tsinghua',
    value: 'ntp.tuna.tsinghua.edu.cn',
  },
  {
    label: 'kernel.ntp.server.ntsc',
    value: 'ntp.ntsc.ac.cn',
  },
  {
    label: 'kernel.ntp.server.google',
    value: 'time.google.com',
  },
  {
    label: 'kernel.ntp.server.cloudflare',
    value: 'time.cloudflare.com',
  },
  {
    label: 'kernel.ntp.server.apple',
    value: 'time.apple.com',
  },
  {
    label: 'kernel.ntp.server.microsoft',
    value: 'time.windows.com',
  },
  {
    label: 'kernel.ntp.server.custom',
    value: 'custom',
  },
] satisfies ComponentOption[]

export const CertificateStoreOptions = defineOptions(
  CertificateStore,
  'kernel.certificate.store.{{val}}',
)

export const CertificateProviderTypeOptions = defineOptions(
  CertificateProviderType,
  'kernel.certificate_providers.type.{{val}}',
)

export const AcmeKeyTypeOptions = defineOptions(
  AcmeKeyType,
  'kernel.certificate_providers.acme.key_type.{{val}}',
)

export const CloudflareOriginCaRequestTypeOptions = defineOptions(
  CloudflareOriginCaRequestType,
  'kernel.certificate_providers.cloudflare_origin_ca.request_type.{{val}}',
)

export const CloudflareOriginCaValidityOptions = defineOptions(
  CloudflareOriginCaValidity,
  'kernel.certificate_providers.cloudflare_origin_ca.requested_validity.{{val}}',
)

export const Dns01ProviderOptions = defineOptions(
  Dns01Provider,
  'kernel.shared.dns01.provider.{{val}}',
)

export const AcmeProviderOptions = defineOptions(
  AcmeProvider,
  'kernel.certificate_providers.acme.provider.{{val}}',
)

export const HttpEngineOptions = defineOptions(HttpEngine, 'kernel.http_clients.engine.{{val}}')

export const HttpVersionOptions = [
  { label: 'HTTP/1.1 (1)', value: HttpVersion.V1 },
  { label: 'HTTP/2 (2)', value: HttpVersion.V2 },
  { label: 'HTTP/3 (3)', value: HttpVersion.V3 },
] as const satisfies ComponentOption<number>[]

export const NetnsTypeOptions = defineOptions(NetnsType, 'kernel.netns.type.{{val}}')

export const EndpointOptions = defineOptions(Endpoint, 'kernel.endpoints.type.{{val}}')

export const InboundOptions = defineOptions(Inbound, '{{val}}')

export const OutboundOptions = defineOptions(Outbound, 'kernel.outbounds.{{val}}')

export const TunStackOptions = defineOptions(TunStack, 'kernel.inbounds.tun.{{val}}')

export const NetworkOptions = [
  {
    label: 'TCP',
    value: Network.Tcp,
  },
  {
    label: 'UDP',
    value: Network.Udp,
  },
] as const satisfies ComponentOption[]

export const RuleSetTypeOptions = defineOptions(RuleSetType, 'kernel.route.rule_set.type.{{val}}')

export const RuleSetFormatOptions = defineOptions(RuleSetFormat, 'ruleset.format.{{val}}')

export const RouteRuleTypeOptions = defineOptions(RouteRuleType, 'kernel.rules.type.{{val}}')

export const RouteRuleActionOptions = defineOptions(
  RouteRuleAction,
  'kernel.route.rules.action.{{val}}',
)

export const RouteRejectMethodOptions = defineOptions(
  RouteRejectMethod,
  'kernel.rules.action.reject.method.{{val}}',
)

export const DnsRuleTypeOptions = defineOptions(DnsRuleType, 'kernel.rules.type.{{val}}')

export const DnsServerTypeOptions = defineOptions(DnsServer, 'kernel.dns.type.{{val}}')

export const DnsRuleActionOptions = defineOptions(
  DnsRuleAction,
  'kernel.route.rules.action.{{val}}',
)

export const DnsRejectMethodOptions = defineOptions(
  DnsRejectMethod,
  'kernel.rules.action.reject.method.{{val}}',
)

export const DomainStrategyOptions = defineOptions(
  DomainStrategy,
  'kernel.shared.domain_resolver.strategy.{{val}}',
)

export const SniffProtocolOptions = defineOptions(
  SniffProtocol,
  'kernel.route.rules.sniffer.{{val}}',
)

export const NetworkTypeOptions = defineOptions(NetworkType, 'kernel.shared.network_type.{{val}}')

export const NetworkStrategyOptions = defineOptions(
  NetworkStrategy,
  'kernel.shared.network_strategy.{{val}}',
)

export const UdpNatBehaviorOptions = defineOptions(
  UdpNatBehavior,
  'kernel.shared.udp_nat.behavior.{{val}}',
)

export const OpenConnectFlavorOptions = defineOptions(
  OpenConnectFlavor,
  'kernel.endpoints.openconnect.flavor.{{val}}',
)

export const OpenConnectTokenModeOptions = defineOptions(
  OpenConnectTokenMode,
  'kernel.endpoints.openconnect.token.mode.{{val}}',
)

export const OpenConnectReportedOsOptions = defineOptions(
  OpenConnectReportedOs,
  'kernel.endpoints.openconnect.reported_os.{{val}}',
)

export const OpenConnectCompressionModeOptions = defineOptions(
  OpenConnectCompressionMode,
  'kernel.endpoints.openconnect.compression_mode.{{val}}',
)

export const OpenVpnModeOptions = defineOptions(
  OpenVpnMode,
  'kernel.endpoints.openvpn.mode.{{val}}',
)

export const OpenVpnTopologyOptions = defineOptions(
  OpenVpnTopology,
  'kernel.endpoints.openvpn.topology.{{val}}',
)

export const OpenVpnAuthRetryOptions = defineOptions(
  OpenVpnAuthRetry,
  'kernel.endpoints.openvpn.auth_retry.{{val}}',
)

export const OpenVpnKeyDirectionOptions = defineOptions(
  OpenVpnKeyDirection,
  'kernel.endpoints.openvpn.key_direction.{{val}}',
)

export const OpenVpnCertNameTypeOptions = defineOptions(
  OpenVpnCertNameType,
  'kernel.endpoints.openvpn.cert_name_type.{{val}}',
)

export const OpenVpnRemoteCertTlsOptions = defineOptions(
  OpenVpnRemoteCertTls,
  'kernel.endpoints.openvpn.remote_cert_tls.{{val}}',
)

export const OpenVpnCertProfileOptions = defineOptions(
  OpenVpnCertProfile,
  'kernel.endpoints.openvpn.cert_profile.{{val}}',
)

export const OpenVpnNsCertTypeOptions = defineOptions(
  OpenVpnNsCertType,
  'kernel.endpoints.openvpn.ns_cert_type.{{val}}',
)

export const OpenVpnControlWrapTypeOptions = defineOptions(
  OpenVpnControlWrapType,
  'kernel.endpoints.openvpn.control_wrap_type.{{val}}',
)

export const OpenVpnMssFixModeOptions = defineOptions(
  OpenVpnMssFixMode,
  'kernel.endpoints.openvpn.mss_fix_mode.{{val}}',
)

export const OpenVpnCompressionOptions = defineOptions(
  OpenVpnCompression,
  'kernel.endpoints.openvpn.compression.{{val}}',
)

export const OpenVpnCompressionLzoOptions = defineOptions(
  OpenVpnCompressionLzo,
  'kernel.endpoints.openvpn.compression_lzo.{{val}}',
)

export const OpenVpnAllowCompressionOptions = defineOptions(
  OpenVpnAllowCompression,
  'kernel.endpoints.openvpn.allow_compression.{{val}}',
)

export const OpenVpnPullFilterActionOptions = defineOptions(
  OpenVpnPullFilterAction,
  'kernel.endpoints.openvpn.pull_filters.action.{{val}}',
)

export const OpenVpnVerifyClientCertOptions = defineOptions(
  OpenVpnVerifyClientCert,
  'kernel.endpoints.openvpn.verify_client_cert.{{val}}',
)

export const OpenVpnDnsSecOptions = defineOptions(
  OpenVpnDnsSec,
  'kernel.endpoints.openvpn.push.dns_servers.dnssec.{{val}}',
)

export const OpenVpnDnsTransportOptions = defineOptions(
  OpenVpnDnsTransport,
  'kernel.endpoints.openvpn.push.dns_servers.transport.{{val}}',
)

export const TlsEngineOptions = defineOptions(TlsEngine, 'kernel.shared.tls.engine.{{val}}')
export const TlsVersionOptions = defineOptions(TlsVersion, '{{val}}')
export const TlsCipherSuiteOptions = defineOptions(TlsCipherSuite, '{{val}}')
export const TlsCurvePreferenceOptions = defineOptions(TlsCurvePreference, '{{val}}')
export const TlsClientAuthenticationOptions = defineOptions(
  TlsClientAuthentication,
  'kernel.shared.tls.client_authentication.{{val}}',
)
export const TlsSpoofMethodOptions = defineOptions(
  TlsSpoofMethod,
  'kernel.shared.tls.spoof_method.{{val}}',
)
export const UtlsFingerprintOptions = defineOptions(UtlsFingerprint, '{{val}}')
