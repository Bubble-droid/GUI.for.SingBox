import {
  ProfileSchemaVersion,
  createCert,
  createExperimental,
  createHttpClient,
  createLog,
  createMixin,
  createNtp,
  createProfile,
  createScript,
} from '@profile/defaults'
import type {
  CertSection,
  ExperimentalSection,
  HttpClientItem,
  LogSection,
  NtpSection,
  Profile,
} from '@profile/types/profiles'
import type {
  Certificate,
  Endpoint,
  Experimental,
  HttpClient,
  Ntp,
  SingBoxConfig,
} from '@profile/types/sing-box/config'
import type { DnsServer } from '@profile/types/sing-box/dns'
import { normalizeArray } from '@profile/utils/helper'

import { sampleID } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import { restoreCertProviders } from './cert-provider'
import { getRestoreContext } from './context'
import { restoreDnsServers, restoreDnsRules } from './dns'
import { restoreEndpoints } from './endpoint'
import { restoreInbounds } from './inbound'
import { restoreNetns } from './netns'
import { restoreOutbounds } from './outbound'
import { restoreRouteRules, restoreRuleSet } from './route'
import {
  restoreDialer,
  restoreHttp2Options,
  restoreOutboundTls,
  restoreQuicOptions,
} from './shared'
import type { IdMaps, RestoreOptions } from './types'

const legacyBuildTagIdMapping = (prefix: string, arr?: Recordable[]): Recordable<string> => {
  if (!arr) {
    return {}
  }
  return arr.reduce((p, c, i) => ((p[c['tag']] = prefix + i), p), {})
}

const buildTagIdMapping = (prefix: string, arr: { tag?: string }[] = []): Map<string, string> =>
  new Map(
    arr.flatMap((v, i) => {
      if (!v.tag) {
        return []
      }
      return [[v.tag, `${prefix}${i}`]]
    }),
  )

const restoreNtp = (maps: IdMaps, raw?: Ntp): NtpSection => {
  const template = createNtp()
  if (!raw) {
    return template
  }
  const { dialer, rest } = restoreDialer(raw, maps)
  return {
    ...template,
    ...rest,
    dialer,
  }
}

const restoreCert = (raw: Certificate = {}): CertSection => {
  const template = createCert()
  return {
    ...template,
    ...raw,
    certificate: normalizeArray(raw.certificate),
    certificate_path: normalizeArray(raw.certificate_path),
    certificate_directory_path: normalizeArray(raw.certificate_directory_path),
  }
}

const restoreHttpClients = (maps: IdMaps, httpClients: HttpClient[] = []): HttpClientItem[] => {
  const template = createHttpClient()
  return httpClients.map((raw) => {
    const { tag, ...reset } = raw
    const id = maps.httpClients.get(tag) ?? sampleID()

    const { dialer, rest: r1 } = restoreDialer(reset, maps)
    const tls = restoreOutboundTls(r1.tls)

    const { http2 } = restoreHttp2Options(r1)
    const { quic, rest: r2 } = restoreQuicOptions(r1)

    return {
      ...template,
      id,
      tag,
      config: {
        ...template.config,
        ...r2,
        headers: (r2.headers ?? {}) as Recordable<string>,
        http2,
        quic,
        tls,
        dialer,
      },
    }
  })
}

const restoreExperimental = (maps: IdMaps, raw: Experimental = {}): ExperimentalSection => {
  const template = createExperimental()
  const { clash_api, cache_file } = raw

  return {
    clash_api: {
      ...template.clash_api,
      ...clash_api,
      access_control_allow_origin: normalizeArray(clash_api?.access_control_allow_origin),
      external_ui_download_detour:
        maps.outbounds.get(clash_api?.external_ui_download_detour ?? '') ?? '',
    },
    cache_file: {
      ...template.cache_file,
      ...cache_file,
    },
  }
}

export const restoreProfile = (
  config: SingBoxConfig,
  name = sampleID(),
  options: RestoreOptions = {},
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
    id: profile?.id ?? sampleID(),
    name,
    schema: ProfileSchemaVersion,
    log: { ...createLog(), ...(config.log as LogSection) },
    ntp: restoreNtp(idMaps, config.ntp),
    experimental: restoreExperimental(idMaps, config.experimental),
    cert: restoreCert(config.certificate),
    certProviders: restoreCertProviders(idMaps, config.certificate_providers),
    httpClients: restoreHttpClients(idMaps, config.http_clients),
    netns: restoreNetns(idMaps, config.network_namespaces),
    endpoints: restoreEndpoints(idMaps, config.endpoints as Endpoint[]),
    inbounds: restoreInbounds(config.inbounds ?? [], InboundsIds),
    outbounds: restoreOutbounds(
      config.outbounds ?? [],
      OutboundsIds,
      profile?.outbounds ?? [],
      subscriptionIds ?? [],
      ctx,
    ),
    route: {
      rule_set: restoreRuleSet(config.route?.rule_set ?? [], RouteRuleSetIds, OutboundsIds, ctx),
      rules: restoreRouteRules(
        config.route?.rules ?? [],
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
      servers: restoreDnsServers(
        (config.dns?.servers as DnsServer[]) ?? [],
        DnsServersIds,
        OutboundsIds,
      ),
      rules: restoreDnsRules(config.dns?.rules ?? [], InboundsIds, RouteRuleSetIds, DnsServersIds),
    },
    mixin: profile?.mixin ?? createMixin(),
    script: profile?.script ?? createScript(),
  }
}
