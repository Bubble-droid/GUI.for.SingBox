import { ProfileSchemaVersion, createMixin, createProfile, createScript } from '@defaults'
import { createLog } from '@defaults/log'
import type { SingBoxConfig, SingBoxEndpoint } from '@features/types/sing-box'
import type { Profile } from '@profiles'
import type { LogConfig } from '@profiles/log'

import { sampleID } from '@/utils/secure'

import { restoreCertificate } from './certificate'
import { restoreCertificateProviders } from './certificate_provider'
import { getRestoreContext } from './context'
import { restoreDnsServers, restoreDnsRules } from './dns'
import { restoreEndpoints } from './endpoints'
import { restoreExperimental } from './experimental'
import { restoreHttpClients } from './http_client'
import { restoreInbounds } from './inbounds'
import { restoreNetns } from './netns'
import { restoreNtp } from './ntp'
import { restoreOutbounds } from './outbounds'
import { restoreRouteRuleset, restoreRouteRules } from './route'
import type { RestoreProfileOptions, IdMaps } from './types'

const legacyBuildTagIdMapping = (prefix: string, arr?: Recordable[]): Recordable<string> => {
  if (!arr) return {}
  return arr.reduce((p, c, i) => ((p[c['tag']] = prefix + i), p), {})
}

const buildTagIdMapping = (prefix: string, arr: { tag?: string }[] = []): Map<string, string> => {
  return new Map(
    arr.flatMap((v, i) => {
      if (!v.tag) return []
      return [[v.tag, `${prefix}${i}`]]
    }),
  )
}

export const restoreProfile = (
  config: SingBoxConfig,
  name = sampleID(),
  options: RestoreProfileOptions = {},
): Profile => {
  const ctx = getRestoreContext()
  const template = createProfile()

  const { profile, subscriptionIds } = options

  const InboundsIds = legacyBuildTagIdMapping('in-', config.inbounds)
  const OutboundsIds = legacyBuildTagIdMapping('out-', config.outbounds)
  const RouteRuleSetIds = legacyBuildTagIdMapping('ruleset-', config.route?.rule_set)
  const DnsServersIds = legacyBuildTagIdMapping('dns-', config.dns?.servers)

  const endpointIds = buildTagIdMapping('ep-', config.endpoints)
  const inboundsIds = buildTagIdMapping('in-', config.inbounds)
  const outboundIds = buildTagIdMapping('out-', config.outbounds)

  const idMaps: IdMaps = {
    certProviders: buildTagIdMapping('cert-', config.certificate_providers),
    httpClients: buildTagIdMapping('http-', config.http_clients),
    netns: buildTagIdMapping('ns-', config.network_namespaces),
    endpoints: endpointIds,
    inbounds: new Map([...endpointIds, ...inboundsIds]),
    outbounds: new Map([...endpointIds, ...outboundIds]),
    dnsServers: buildTagIdMapping('dns-', config.dns?.servers),
  }

  return {
    id: profile?.id || sampleID(),
    name,
    schema: ProfileSchemaVersion,
    log: { ...createLog(), ...(config.log as LogConfig) },
    ntp: restoreNtp(config.ntp, idMaps),
    experimental: restoreExperimental(config.experimental, idMaps),
    certificate: restoreCertificate(config.certificate),
    certificate_providers: restoreCertificateProviders(config.certificate_providers, idMaps),
    http_clients: restoreHttpClients(config.http_clients, idMaps),
    network_namespaces: restoreNetns(config.network_namespaces, idMaps),
    endpoints: restoreEndpoints(config.endpoints as SingBoxEndpoint[], idMaps),
    inbounds: restoreInbounds(config.inbounds || [], InboundsIds),
    outbounds: restoreOutbounds(
      config.outbounds || [],
      OutboundsIds,
      profile?.outbounds || [],
      subscriptionIds || [],
      ctx,
    ),
    route: {
      rule_set: restoreRouteRuleset(
        config.route?.rule_set || [],
        RouteRuleSetIds,
        OutboundsIds,
        ctx,
      ),
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
      final: OutboundsIds[config.route?.final ?? ''] ?? template.route.final,
      default_domain_resolver: {
        server:
          DnsServersIds[(config.route?.default_domain_resolver as any)?.server] ??
          template.route.default_domain_resolver.server,
        client_subnet:
          (config.route?.default_domain_resolver as any)?.client_subnet ??
          template.route.default_domain_resolver.client_subnet,
      },
    },
    dns: {
      disable_cache: config.dns?.disable_cache ?? template.dns.disable_cache,
      disable_expire: config.dns?.disable_expire ?? template.dns.disable_expire,
      independent_cache: config.dns?.independent_cache ?? template.dns.independent_cache,
      final: DnsServersIds[config.dns?.final ?? ''] ?? template.dns.final,
      strategy: config.dns?.strategy ?? template.dns.strategy,
      client_subnet: config.dns?.client_subnet ?? template.dns.client_subnet,
      servers: restoreDnsServers(config.dns?.servers || [], DnsServersIds, OutboundsIds),
      rules: restoreDnsRules(config.dns?.rules || [], InboundsIds, RouteRuleSetIds, DnsServersIds),
    },
    mixin: profile?.mixin || createMixin(),
    script: profile?.script || createScript(),
  }
}
