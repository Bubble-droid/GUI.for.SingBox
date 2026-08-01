import { RouteRuleType, DnsRuleType } from '@/enums'
import { createDefaultDialer, createDefaultDomainResolver } from '@/features/config/defaults'
import { extractProps, ensureArray } from '@/features/utils'

import type {
  SingBoxDomainResolver,
  DomainResolver,
  Dialer,
  SingBoxDialer,
} from '@/features/config/types'

import type { IdMaps } from './types'

export const supportedRuleTypes = [
  RouteRuleType.Inbound,
  RouteRuleType.Network,
  RouteRuleType.Protocol,
  RouteRuleType.Domain,
  RouteRuleType.DomainSuffix,
  RouteRuleType.DomainKeyword,
  RouteRuleType.DomainRegex,
  RouteRuleType.SourceIPCidr,
  RouteRuleType.IpCidr,
  RouteRuleType.SourcePort,
  RouteRuleType.SourcePortRange,
  RouteRuleType.Port,
  RouteRuleType.PortRange,
  RouteRuleType.ProcessName,
  RouteRuleType.ProcessPath,
  RouteRuleType.ProcessPathRegex,
  RouteRuleType.RuleSet,
  RouteRuleType.IpIsPrivate,
  RouteRuleType.ClashMode,
  DnsRuleType.IpAcceptAny,
]

export const restoreDomainResolver = (
  raw: SingBoxDomainResolver | string | undefined,
  maps: IdMaps,
): DomainResolver => {
  const template = createDefaultDomainResolver()
  const normalizedResolver = !raw
    ? template
    : typeof raw === 'string'
      ? { ...template, server: raw }
      : extractProps(raw, template).owned
  const resolver: DomainResolver = {
    ...template,
    ...normalizedResolver,
    server: maps.dnsServers.get(normalizedResolver.server) ?? '',
  }
  return resolver
}

export const restoreDialer = <T extends object>(
  raw: T,
  maps: IdMaps,
): {
  dialer: Dialer
  rest: Omit<T, keyof Dialer>
} => {
  const template = createDefaultDialer()
  const result = extractProps(raw, template)
  const owned = result.owned as SingBoxDialer
  const resolver = restoreDomainResolver(owned.domain_resolver, maps)
  const dialer: Dialer = {
    ...template,
    ...owned,
    network_type: ensureArray(owned.network_type),
    fallback_network_type: ensureArray(owned.fallback_network_type),
    detour: maps.outbounds.get(owned.detour!) ?? '',
    domain_resolver: resolver,
  }
  return { dialer, rest: result.rest }
}
