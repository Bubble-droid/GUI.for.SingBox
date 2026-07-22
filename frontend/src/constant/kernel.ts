import {
  ClashMode,
  DnsRcode,
  DnsRejectMethod,
  DnsRuleAction,
  DnsRuleType,
  DnsServer,
  DomainStrategy,
  Endpoint,
  Inbound,
  IpVersion,
  LogicalRuleMode,
  LogLevel,
  Network,
  NetworkStrategy,
  NetworkType,
  Outbound,
  QuicClient,
  RouteRejectMethod,
  RouteRuleAction,
  RouteRuleType,
  RuleSetFormat,
  RuleSetType,
  RuleType,
  Service,
  SniffProtocol,
  TlsSpoofMethod,
  TunDnsMode,
  TunStack,
} from '@/enums/kernel'

import type { ComponentOption } from '@/types'

export const CoreWorkingDirectory = 'data/sing-box'
export const CorePidFilePath = CoreWorkingDirectory + '/pid.txt'
export const CoreLogFilePath = CoreWorkingDirectory + '/sing-box.log'
export const CoreConfigFilePath = CoreWorkingDirectory + '/config.json'
export const CoreCacheFilePath = CoreWorkingDirectory + '/cache.db'

type FormatString<
  Pattern extends string,
  Val extends string,
> = Pattern extends `${infer Start}{{val}}${infer End}` ? `${Start}${Val}${End}` : Pattern

type OptionItem<TValue extends string, TLabelPattern extends string> = TValue extends string
  ? {
      value: TValue
      label: FormatString<TLabelPattern, TValue>
    }
  : never

export const defineOptions = <
  const TSource extends Record<string, string>,
  const TLabelPattern extends string,
>(
  source: TSource,
  pattern: TLabelPattern,
) => {
  type TValue = TSource[keyof TSource] & string

  return Object.values(source).map((v) => ({
    value: v,
    label: pattern.replace('{{val}}', v),
  })) as OptionItem<TValue, TLabelPattern>[]
}

export const PredefinedClashModeOptions = defineOptions(
  ClashMode,
  'kernel.rules.clash_mode.{{val}}',
)

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

export const EndpointOptions = defineOptions(Endpoint, 'kernel.endpoints.type.{{val}}')

export const ServiceOptions = defineOptions(Service, 'kernel.services.type.{{val}}')

export const InboundOptions = defineOptions(Inbound, 'kernel.inbounds.type.{{val}}')

export const TunDnsModeOptions = defineOptions(TunDnsMode, 'kernel.inbounds.tun.dns_mode.{{val}}')

export const TunStackOptions = defineOptions(TunStack, 'kernel.inbounds.tun.stack.{{val}}')

export const OutboundOptions = defineOptions(Outbound, 'kernel.outbounds.type.{{val}}')

export const NetworkOptions = defineOptions(Network, 'kernel.rules.network.{{val}}')

export const RuleSetTypeOptions = defineOptions(RuleSetType, 'kernel.route.rule_set.type.{{val}}')

export const RuleSetFormatOptions = defineOptions(
  RuleSetFormat,
  'kernel.route.rule_set.format.{{val}}',
)

export const RuleTypeOptions = defineOptions(RuleType, 'kernel.rules.type.{{val}}')

export const RouteRuleTypeOptions = defineOptions(
  RouteRuleType,
  'kernel.rules.condition.type.{{val}}',
)

export const DnsRuleTypeOptions = defineOptions(DnsRuleType, 'kernel.rules.condition.type.{{val}}')

export const DomainStrategyOptions = defineOptions(
  DomainStrategy,
  'kernel.domain_resolver.strategy.{{val}}',
)

export const LogicalModeOptions = defineOptions(
  LogicalRuleMode,
  'kernel.rules.logical.mode.{{val}}',
)

export const RouteRuleActionOptions = defineOptions(
  RouteRuleAction,
  'kernel.rules.action.{{val}}.name',
)

export const TlsSpoofMethodOptions = defineOptions(
  TlsSpoofMethod,
  'kernel.rules.action.route-options.tls_spoof_method.{{val}}',
)

export const RouteRejectMethodOptions = defineOptions(
  RouteRejectMethod,
  'kernel.rules.action.reject.method.{{val}}',
)

export const DnsRuleActionOptions = defineOptions(DnsRuleAction, 'kernel.rules.action.{{val}}.name')

export const DnsRejectMethodOptions = defineOptions(
  DnsRejectMethod,
  'kernel.rules.action.reject.method.{{val}}',
)

export const DnsRcodeOptions = defineOptions(DnsRcode, 'kernel.rules.action.predefined.rcode.{{val}}')

export const DnsServerOptions = defineOptions(DnsServer, 'kernel.dns.servers.type.{{val}}')

export const SniffProtocolOptions = defineOptions(SniffProtocol, 'kernel.rules.protocol.{{val}}')

export const IpVersionOptions = defineOptions(IpVersion, 'kernel.rules.ip_version.{{val}}')

export const QuicClientOptions = defineOptions(QuicClient, 'kernel.rules.client.{{val}}')

export const NetworkTypeOptions = defineOptions(NetworkType, 'kernel.rules.network_type.{{val}}')

export const NetworkStrategyOptions = defineOptions(
  NetworkStrategy,
  'kernel.rules.network_strategy.{{val}}',
)

export const EmptyRuleSet = {
  version: 1,
  rules: [],
}

export const DefaultExcludeProtocols = 'direct|reject|selector|urltest|block|dns|shadowsocksr'

export const BuiltInOutbound = [Outbound.Direct, Outbound.Block]

export const DefaultConnections = () => {
  return {
    visibility: {
      'metadata.type': true,
      'metadata.processPath': false,
      'metadata.host': true,
      'metadata.sourceIP': false,
      'metadata.destinationIP': false,
      rule: true,
      chains: true,
      up: true,
      down: true,
      upload: true,
      download: true,
      start: true,
    },
    order: [
      'metadata.type',
      'metadata.processPath',
      'metadata.host',
      'metadata.sourceIP',
      'metadata.destinationIP',
      'rule',
      'chains',
      'up',
      'down',
      'upload',
      'download',
      'start',
    ],
  }
}

export const DefaultCoreConfig = () => {
  return {
    env: {},
    args: ['run', '--disable-color', '-c', '$CORE_BASE_PATH/config.json', '-D', '$CORE_BASE_PATH'],
  }
}
