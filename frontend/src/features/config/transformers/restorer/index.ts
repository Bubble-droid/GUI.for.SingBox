import { DefaultLog, DefaultMixin, DefaultScript, ProfileSchemaVersion } from '@/constant'
import { useProfilesStore } from '@/stores'
import { sampleID, deepAssign, restoreExperimental } from '@/utils'

import type { Profile } from '@/features/config/types'

import { restoreDnsServers } from './dns'
import { restoreDnsRules } from './dns/rules'
import { restoreInbounds } from './inbounds'
import { restoreOutbounds } from './outbounds'
import { restoreRouteRules, restoreRouteRuleset } from './route'
import type { RestoreProfileOptions } from './types'

export * from './experimental'
export * from './inbounds'
export * from './outbounds'
export * from './route'
export * from './dns'

const buildTagIdMapping = (prefix: string, arr?: Recordable[]): Recordable<string> => {
  if (!arr) return {}
  return arr.reduce((p, c, i) => ((p[c.tag] = prefix + i), p), {})
}

export const restoreProfile = (
  config: Recordable,
  name = sampleID(),
  options: RestoreProfileOptions = {},
): Profile => {
  const template = useProfilesStore().getProfileTemplate()

  const { profile, subscriptionIds } = options

  const InboundsIds = buildTagIdMapping('in-', config.inbounds)
  const OutboundsIds = buildTagIdMapping('out-', config.outbounds)
  const RouteRuleSetIds = buildTagIdMapping('ruleset-', config.route?.rule_set)
  const DnsServersIds = buildTagIdMapping('dns-', config.dns?.servers)

  return {
    id: profile?.id || sampleID(),
    name,
    schema: ProfileSchemaVersion,
    log: deepAssign(DefaultLog(), config.log),
    experimental: restoreExperimental(config.experimental, OutboundsIds),
    inbounds: restoreInbounds(config.inbounds || [], InboundsIds),
    outbounds: restoreOutbounds(
      config.outbounds || [],
      OutboundsIds,
      profile?.outbounds || [],
      subscriptionIds || [],
    ),
    route: {
      rule_set: restoreRouteRuleset(config.route?.rule_set || [], RouteRuleSetIds, OutboundsIds),
      rules: restoreRouteRules(
        config.route?.rules || [],
        InboundsIds,
        OutboundsIds,
        RouteRuleSetIds,
        DnsServersIds,
      ),
      auto_detect_interface:
        config.route?.auto_detect_interface ?? template.route.auto_detect_interface,
      find_process: config.route?.find_process ?? template.route.find_process,
      default_interface: config.route?.default_interface ?? template.route.default_interface,
      final: OutboundsIds[config.route?.final] ?? template.route.final,
      default_domain_resolver: {
        server:
          DnsServersIds[config.route?.default_domain_resolver?.server] ??
          template.route.default_domain_resolver.server,
        client_subnet:
          config.route?.default_domain_resolver?.client_subnet ??
          template.route.default_domain_resolver.client_subnet,
      },
    },
    dns: {
      disable_cache: config.dns?.disable_cache ?? template.dns.disable_cache,
      disable_expire: config.dns?.disable_expire ?? template.dns.disable_expire,
      independent_cache: config.dns?.independent_cache ?? template.dns.independent_cache,
      final: DnsServersIds[config.dns?.final] ?? template.dns.final,
      strategy: config.dns?.strategy ?? template.dns.strategy,
      client_subnet: config.dns?.client_subnet ?? template.dns.client_subnet,
      servers: restoreDnsServers(config.dns?.servers || [], DnsServersIds, OutboundsIds),
      rules: restoreDnsRules(config.dns?.rules || [], InboundsIds, RouteRuleSetIds, DnsServersIds),
    },
    mixin: profile?.mixin || DefaultMixin(),
    script: profile?.script || DefaultScript(),
  }
}
