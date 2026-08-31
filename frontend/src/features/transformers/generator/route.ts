import { RouteRuleType, RouteRuleAction, RuleSetType } from '@features/constant/kernel'
import type { DnsConfig } from '@profiles/dns'
import type { InboundConfig } from '@profiles/inbounds'
import type { OutboundConfig } from '@profiles/outbounds'
import type { RouteConfig, RuleSetConfig } from '@profiles/route'

import { deepAssign } from '@/utils/others'

import type { Recordable } from '@/types'

import { generateRule } from './shared'
import type { GenerateContext } from './types'

export const generateRoute = (
  route: RouteConfig,
  inbounds: InboundConfig[],
  outbounds: OutboundConfig[],
  dns: DnsConfig,
  ctx: GenerateContext,
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const isInboundEnabled = (id: string) => inbounds.find((v) => v.id === id)?.enable

  const routeExtra: Recordable = {}
  if (!route.auto_detect_interface) {
    routeExtra['default_interface'] = route.default_interface
  }
  return {
    rules: route.rules.flatMap((rule) => {
      if (rule.type === RouteRuleType.InsertionPoint || !rule.enable) {
        return []
      }
      if (rule.type === RouteRuleType.Inbound && isInboundEnabled(rule.payload) !== true) {
        return []
      }
      const extra: Recordable = generateRule(rule, route.rule_set, inbounds)

      if (rule.action === RouteRuleAction.Route) {
        extra['outbound'] = getOutbound(rule.outbound)
      } else if (rule.action === RouteRuleAction.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.outbound))
      } else if (rule.action === RouteRuleAction.Reject) {
        extra['method'] = rule.outbound
      } else if (rule.action === RouteRuleAction.Sniff) {
        if (rule.sniffer.length > 0) {
          extra['sniffer'] = rule.sniffer
        }
      } else if (rule.action === RouteRuleAction.Resolve) {
        if (rule.strategy) {
          extra['strategy'] = rule.strategy
        }
        extra['server'] = getDnsServer(rule.server)
      }
      if (rule.invert) {
        extra['invert'] = true
      }
      return extra
    }),
    rule_set: route.rule_set.map((ruleset) => {
      const extra: Partial<RuleSetConfig> = {}
      if (ruleset.type === RouteRuleType.Inline) {
        extra.rules = JSON.parse(ruleset.rules) as string
      } else if (ruleset.type === RuleSetType.Local) {
        const localRuleset = ctx.getRuleSet(ruleset.path)
        extra.path = localRuleset?.path.replace(/^data\//v, `${ctx.appEnv.appDataPath}/`) ?? ''
        extra.format = ruleset.format
      } else if (ruleset.type === RuleSetType.Remote) {
        extra.url = ruleset.url
        extra.format = ruleset.format
        extra.download_detour = getOutbound(ruleset.download_detour)!
        if (ruleset.update_interval) {
          extra.update_interval = ruleset.update_interval
        }
      }
      return {
        tag: ruleset.tag,
        type: ruleset.type,
        ...extra,
      }
    }),
    auto_detect_interface: route.auto_detect_interface,
    find_process: route.find_process ? true : undefined,
    final: getOutbound(route.final),
    default_domain_resolver: {
      server: getDnsServer(route.default_domain_resolver.server),
    },
    ...routeExtra,
  }
}
