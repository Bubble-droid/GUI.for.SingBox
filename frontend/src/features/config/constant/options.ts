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
} from './kernel'

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

const defineOptions = <
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

export const InboundOptions = defineOptions(Inbound, '{{val}}')

export const OutboundOptions = defineOptions(Outbound, 'kernel.outbounds.{{val}}')

export const TunStackOptions = defineOptions(TunStack, 'kernel.inbounds.tun.{{val}}')

export const NetworkOptions = defineOptions(Network, 'kernel.shared.network.{{val}}')

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

export const DomainStrategyOptions = defineOptions(DomainStrategy, 'kernel.strategy.{{val}}')

export const SniffProtocolOptions = defineOptions(
  SniffProtocol,
  'kernel.route.rules.sniffer.{{val}}',
)
