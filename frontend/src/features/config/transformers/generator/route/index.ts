import { RouteRuleType, RouteRuleAction, DomainStrategy, RuleSetType } from '@/enums'
import { useEnvStore, useRulesetsStore } from '@/stores'
import { deepAssign } from '@/utils'

import type { DnsConfig, InboundConfig, OutboundConfig, RouteConfig } from '@/features/config/types'

import { _generateRule } from '../shared'

export const generateRoute = (
  route: RouteConfig,
  inbounds: InboundConfig[],
  outbounds: OutboundConfig[],
  dns: DnsConfig,
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)?.tag
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const isInboundEnabled = (id: string) => inbounds.find((v) => v.id === id)?.enable

  const { env } = useEnvStore()
  const rulesetsStore = useRulesetsStore()

  const extra: Recordable = {}
  if (!route.auto_detect_interface) {
    extra.default_interface = route.default_interface
  }
  return {
    rules: route.rules.flatMap((rule) => {
      if (rule.type === RouteRuleType.InsertionPoint || !rule.enable) {
        return []
      }
      if (rule.type === RouteRuleType.Inbound && !isInboundEnabled(rule.payload)) {
        return []
      }
      const extra: Recordable = _generateRule(rule, route.rule_set, inbounds)

      if (rule.action === RouteRuleAction.Route) {
        extra.outbound = getOutbound(rule.outbound)
      } else if (rule.action === RouteRuleAction.RouteOptions) {
        deepAssign(extra, JSON.parse(rule.outbound))
      } else if (rule.action === RouteRuleAction.Reject) {
        extra.method = rule.outbound
      } else if (rule.action === RouteRuleAction.Sniff) {
        if (rule.sniffer.length) {
          extra.sniffer = rule.sniffer
        }
      } else if (rule.action === RouteRuleAction.Resolve) {
        if (rule.strategy !== DomainStrategy.Default) {
          extra.strategy = rule.strategy
        }
        extra.server = getDnsServer(rule.server)
      }
      if (rule.invert) {
        extra.invert = true
      }
      return extra
    }),
    rule_set: route.rule_set.map((ruleset) => {
      const extra: Recordable = {}
      if (ruleset.type === RouteRuleType.Inline) {
        extra.rules = JSON.parse(ruleset.rules)
      } else if (ruleset.type === RuleSetType.Local) {
        const _ruleset = rulesetsStore.getRulesetById(ruleset.path)
        extra.path = _ruleset?.path.replace(/^data\//, `${env.appDataPath}/`)
        extra.format = ruleset.format
      } else if (ruleset.type === RuleSetType.Remote) {
        extra.url = ruleset.url
        extra.format = ruleset.format
        extra.download_detour = getOutbound(ruleset.download_detour)
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
    ...extra,
  }
}
