import { createRouteRuleset, createRouteRule } from '@defaults/route'
import { RuleSetType, RouteRuleAction, RouteRuleType } from '@features/constant/kernel'
import type { RuleSetConfig, RouteRuleConfig } from '@profiles/route'

import { useEnvStore, useRulesetsStore } from '@/stores'

import { supportedRuleTypes } from './shared'

export const restoreRouteRuleset = (
  rulesets: Recordable[],
  RouteRuleSetIds: Recordable,
  OutboundsIds: Recordable,
): RuleSetConfig[] => {
  const { env } = useEnvStore()
  const rulesetsStore = useRulesetsStore()
  return rulesets.flatMap((raw) => {
    const ruleset = createRouteRuleset()
    ruleset.id = RouteRuleSetIds[raw.tag]
    ruleset.type = raw.type
    ruleset.tag = raw.tag

    if (raw.type === RuleSetType.Inline) {
      if ('rules' in raw) {
        ruleset.rules = JSON.stringify(raw.rules, null, 2)
      }
    } else if (raw.type === RuleSetType.Local) {
      if ('path' in raw) {
        const r = rulesetsStore.rulesets.find(
          (v) => v.path === raw.path.replace(`${env.appDataPath}/`, 'data/'),
        )
        if (r) {
          ruleset.path = r.id
        } else {
          ruleset.path = raw.path
        }
      }
      if ('format' in raw) {
        ruleset.format = raw.format
      }
    } else if (raw.type === RuleSetType.Remote) {
      if ('format' in raw) {
        ruleset.format = raw.format
      }
      if ('url' in raw) {
        ruleset.url = raw.url
      }
      if ('download_detour' in raw) {
        ruleset.download_detour = OutboundsIds[raw.download_detour]
      }
      if ('update_interval' in raw) {
        ruleset.update_interval = raw.update_interval
      }
    }
    return ruleset
  })
}

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
