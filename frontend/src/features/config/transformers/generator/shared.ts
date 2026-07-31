import { RouteRuleType, DnsRuleType } from '@/enums'
import { deepAssign } from '@/utils'

import type {
  DnsRuleConfig,
  InboundConfig,
  RouteRuleConfig,
  RuleSetConfig,
} from '@/features/config/types'

export const _generateRule = (
  rule: RouteRuleConfig | DnsRuleConfig,
  rule_set: RuleSetConfig[],
  inbounds: InboundConfig[],
) => {
  const getInbound = (id: string) => inbounds.find((v) => v.id === id)?.tag
  const getRuleset = (id: string) => rule_set.find((v) => v.id === id)?.tag

  const extra: Recordable = { action: rule.action, invert: rule.invert ? true : undefined }
  if (rule.type === RouteRuleType.Inline) {
    deepAssign(extra, JSON.parse(rule.payload))
  } else if (rule.type === RouteRuleType.RuleSet) {
    extra[rule.type] = rule.payload.split(',').map((id) => getRuleset(id))
  } else if (rule.type === RouteRuleType.Inbound) {
    extra[rule.type] = getInbound(rule.payload)
  } else if ([RouteRuleType.IpIsPrivate, DnsRuleType.IpAcceptAny].includes(rule.type as any)) {
    extra[rule.type] = rule.payload === 'true'
  } else if (rule.type === RouteRuleType.ClashMode) {
    extra[rule.type] = rule.payload
  } else {
    extra[rule.type] = String(rule.payload)
      .split(',')
      .map((val) => {
        if ([RouteRuleType.Port, RouteRuleType.SourcePort].includes(rule.type as any)) {
          return Number(val)
        }
        return val
      })
    if (extra[rule.type].length === 1) {
      extra[rule.type] = extra[rule.type][0]
    }
  }
  return extra
}
