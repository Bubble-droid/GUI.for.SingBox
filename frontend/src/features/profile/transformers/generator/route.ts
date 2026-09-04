import { RouteActionKind, RouteRuleType, RuleSetType } from '@profile/constant/kernel'
import type { DnsSection } from '@profile/types/profiles/dns'
import type { InboundItem } from '@profile/types/profiles/inbound'
import type { OutboundItem } from '@profile/types/profiles/outbound'
import type { RouteSection, RuleSetItem } from '@profile/types/profiles/route'

import { deepAssign } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import { generateRuleItem } from './shared'
import type { GenerateContext } from './types'

export const generateRoute = (
  route: RouteSection,
  inbounds: InboundItem[],
  outbounds: OutboundItem[],
  dns: DnsSection,
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
      const extra: Recordable = generateRuleItem(rule, route.rule_set, inbounds)

      if (rule.action === RouteActionKind.Route) {
        extra['outbound'] = getOutbound(rule.outbound)
      } else if (rule.action === RouteActionKind.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.outbound))
      } else if (rule.action === RouteActionKind.Reject) {
        extra['method'] = rule.outbound
      } else if (rule.action === RouteActionKind.Sniff) {
        if (rule.sniffer.length > 0) {
          extra['sniffer'] = rule.sniffer
        }
      } else if (rule.action === RouteActionKind.Resolve) {
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
      const extra: Partial<RuleSetItem> = {}
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
