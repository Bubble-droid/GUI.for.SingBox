import { createRouteRule } from '@/constant'
import { RouteRuleAction, RouteRuleType } from '@/enums'
import { supportedRuleTypes } from '@/features/config/transformers/restorer/shared'

import type { RouteRuleConfig } from '@/features/config/types'

export const restoreRouteRules = (
  rules: Recordable[],
  InboundsIds: Recordable,
  OutboundsIds: Recordable,
  RouteRuleSetIds: Recordable,
  DnsServersIds: Recordable,
): RouteRuleConfig[] => {
  return rules.flatMap((raw, i) => {
    const rule = createRouteRule()

    rule.id = 'rule-' + i
    rule.action = raw.action || RouteRuleAction.Route

    const hits = supportedRuleTypes.filter((key) => key in raw)
    if (hits.length === 1) {
      rule.type = hits[0] as any
    } else {
      rule.type = RouteRuleType.Inline
    }

    if (rule.type === RouteRuleType.Inline) {
      rule.payload = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          outbound: undefined,
          sniffer: undefined,
          strategy: undefined,
          server: undefined,
        },
        null,
        2,
      )
    } else if (rule.type === RouteRuleType.Inbound) {
      rule.payload = InboundsIds[raw[rule.type]]
    } else if (rule.type === RouteRuleType.RuleSet) {
      const rs = Array.isArray(raw[rule.type]) ? raw[rule.type] : [raw[rule.type]]
      rule.payload = rs.map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = Array.isArray(raw[rule.type])
        ? raw[rule.type].join(',')
        : String(raw[rule.type])
    }

    if (RouteRuleAction.Route === raw.action) {
      rule.outbound = OutboundsIds[raw.outbound]
    } else if (RouteRuleAction.Reject === raw.action) {
      if ('method' in raw) {
        rule.outbound = raw.method
      }
    } else if (RouteRuleAction.RouteOptions === raw.action) {
      rule.outbound = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          ...supportedRuleTypes.reduce((p, c) => ((p[c] = undefined), p), {} as Recordable),
        },
        null,
        2,
      )
    } else if (RouteRuleAction.Sniff === raw.action) {
      if ('sniffer' in raw) {
        rule.sniffer = Array.isArray(raw.sniffer) ? raw.sniffer : [raw.sniffer]
      }
    } else if (RouteRuleAction.Resolve === raw.action) {
      if ('strategy' in raw) {
        rule.strategy = raw.strategy
      }
      if ('server' in raw) {
        rule.server = DnsServersIds[raw.server]
      }
    }
    if ('invert' in raw) {
      rule.invert = raw.invert
    }
    return rule
  })
}
