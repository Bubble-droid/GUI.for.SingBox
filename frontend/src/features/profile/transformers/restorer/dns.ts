import { DnsActionKind, DnsRuleType, DnsServerType } from '@profile/constant/kernel'
import { createDnsServer, createDnsRule } from '@profile/defaults/dns'
import type { DnsRuleItem, DnsServerItem } from '@profile/types/profiles/dns'
import type { DnsServer } from '@profile/types/sing-box/dns'

import type { Recordable } from '@/types/typescript'

import { supportedRuleTypes } from './shared'

export const restoreDnsServers = (
  servers: DnsServer[],
  DnsServersIds: Recordable<string>,
  OutboundsIds: Recordable<string>,
): DnsServerItem[] =>
  servers.flatMap((raw) => {
    if (!raw.type) {
      return []
    }
    const server = createDnsServer()
    server.id = DnsServersIds[raw.tag]!
    server.tag = raw.tag
    server.type = raw.type as DnsServerType
    if (
      (
        [
          DnsServerType.Local,
          DnsServerType.Tcp,
          DnsServerType.Udp,
          DnsServerType.Tls,
          DnsServerType.Quic,
          DnsServerType.Https,
          DnsServerType.H3,
          DnsServerType.Dhcp,
        ] as string[]
      ).includes(raw.type)
    ) {
      if ('detour' in raw) {
        server.detour = OutboundsIds[raw.detour!]!
      }
      if ('domain_resolver' in raw) {
        server.domain_resolver = DnsServersIds[raw.domain_resolver as string]!
      }
      if (
        (
          [
            DnsServerType.Tcp,
            DnsServerType.Udp,
            DnsServerType.Tls,
            DnsServerType.Quic,
            DnsServerType.Https,
            DnsServerType.H3,
          ] as string[]
        ).includes(raw.type)
      ) {
        if ('server' in raw) {
          server.server = raw.server
        }
        if ('server_port' in raw) {
          server.server_port = String(raw.server_port)
        }
        if (
          ([DnsServerType.Https, DnsServerType.H3] as string[]).includes(raw.type) &&
          'path' in raw
        ) {
          server.path = raw.path as string
        }
      }
    } else if (DnsServerType.Hosts === server.type) {
      if ('path' in raw) {
        server.hosts_path = raw.path as string[]
      }
      if ('predefined' in raw) {
        server.predefined = Object.entries<string[] | string>(raw.predefined!).reduce<Recordable>(
          (p, [key, value]) => {
            p[key] = Array.isArray(value) ? value.join(',') : value
            return p
          },
          {},
        )
      }
    } else if (DnsServerType.Dhcp === server.type) {
      if ('interface' in raw) {
        server.interface = raw.interface as string
      }
    } else if (DnsServerType.FakeIp === server.type) {
      if ('inet4_range' in raw) {
        server.inet4_range = raw.inet4_range
      }
      if ('inet6_range' in raw) {
        server.inet6_range = raw.inet6_range
      }
    }
    return server
  })

export const restoreDnsRules = (
  rules: Recordable[],
  InboundsIds: Recordable,
  RouteRuleSetIds: Recordable,
  DnsServersIds: Recordable,
): DnsRuleItem[] =>
  rules.flatMap((raw: Recordable, i) => {
    const rule = createDnsRule()
    rule.id = `rule-${i}`
    rule.action = raw['action'] ?? DnsActionKind.Route

    const hits = supportedRuleTypes.filter((key) => key in raw)
    if (hits.length === 1) {
      rule.type = hits[0] as any
    } else {
      rule.type = DnsRuleType.Inline
    }

    if (rule.type === DnsRuleType.Inline) {
      rule.payload = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          client_subnet: undefined,
          disable_cache: undefined,
          strategy: undefined,
          server: undefined,
        },
        null,
        2,
      )
    } else if (rule.type === DnsRuleType.Inbound) {
      rule.payload = InboundsIds[raw[rule.type]]
    } else if (rule.type === DnsRuleType.RuleSet) {
      const rs = Array.isArray(raw[rule.type]) ? raw[rule.type] : [raw[rule.type]]
      rule.payload = rs.map((tag: string) => RouteRuleSetIds[tag]).join(',')
    } else {
      rule.payload = Array.isArray(raw[rule.type])
        ? raw[rule.type].join(',')
        : String(raw[rule.type])
    }

    if (DnsActionKind.Route === raw['action']) {
      if ('server' in raw) {
        rule.server = DnsServersIds[raw['server']]
      }
      if ('strategy' in raw) {
        rule.strategy = raw['strategy']
      }
    } else if (DnsActionKind.Reject === raw['action']) {
      if ('method' in raw) {
        rule.server = raw['method']
      }
    } else if ([DnsActionKind.RouteOptions, DnsActionKind.Predefined].includes(raw['action'])) {
      rule.server = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          disable_cache: undefined,
          client_subnet: undefined,
          strategy: undefined,
          server: undefined,
          ...supportedRuleTypes.reduce<Recordable>((p, c) => ((p[c] = undefined), p), {}),
        },
        null,
        2,
      )
    }
    if ([DnsActionKind.Route, DnsActionKind.RouteOptions].includes(raw['action'])) {
      if ('disable_cache' in raw) {
        rule.disable_cache = raw['disable_cache']
      }
      if ('client_subnet' in raw) {
        rule.client_subnet = raw['client_subnet']
      }
    }
    if ('invert' in raw) {
      rule.invert = raw['invert']
    }
    return rule
  })
