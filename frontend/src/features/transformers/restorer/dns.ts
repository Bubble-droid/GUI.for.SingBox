import { createDnsServer, createDnsRule } from '@defaults/dns'
import { DnsServer, DnsRuleAction, RouteRuleType } from '@features/constant/kernel'
import type { DnsServerConfig, DnsRuleConfig } from '@profiles/dns'

import { supportedRuleTypes } from './shared'

export const restoreDnsServers = (
  servers: Recordable[],
  DnsServersIds: Recordable,
  OutboundsIds: Recordable,
): DnsServerConfig[] => {
  return servers.flatMap((raw) => {
    if (!raw.type) return []
    const server = createDnsServer()
    server.id = DnsServersIds[raw.tag]
    server.tag = raw.tag
    server.type = raw.type
    if (
      [
        DnsServer.Local,
        DnsServer.Tcp,
        DnsServer.Udp,
        DnsServer.Tls,
        DnsServer.Quic,
        DnsServer.Https,
        DnsServer.H3,
        DnsServer.Dhcp,
      ].includes(raw.type)
    ) {
      if ('detour' in raw) {
        server.detour = OutboundsIds[raw.detour]
      }
      if ('domain_resolver' in raw) {
        server.domain_resolver = DnsServersIds[raw.domain_resolver]
      }
      if (
        [
          DnsServer.Tcp,
          DnsServer.Udp,
          DnsServer.Tls,
          DnsServer.Quic,
          DnsServer.Https,
          DnsServer.H3,
        ].includes(raw.type)
      ) {
        if ('server' in raw) {
          server.server = raw.server
        }
        if ('server_port' in raw) {
          server.server_port = raw.server_port
        }
        if ([DnsServer.Https, DnsServer.H3].includes(raw.type)) {
          if ('path' in raw) {
            server.path = raw.path
          }
        }
      }
    } else if (DnsServer.Hosts === server.type) {
      if ('path' in raw) {
        server.hosts_path = raw.path
      }
      if ('predefined' in raw) {
        server.predefined = Object.entries<string[] | string>(raw.predefined).reduce(
          (p, [key, value]) => {
            p[key] = Array.isArray(value) ? value.join(',') : value
            return p
          },
          {} as Recordable,
        )
      }
    } else if (DnsServer.Dhcp === server.type) {
      if ('interface' in raw) {
        server.interface = raw.interface
      }
    } else if (DnsServer.FakeIp === server.type) {
      if ('inet4_range' in raw) {
        server.inet4_range = raw.inet4_range
      }
      if ('inet6_range' in raw) {
        server.inet6_range = raw.inet6_range
      }
    }
    return server
  })
}

export const restoreDnsRules = (
  rules: Recordable[],
  InboundsIds: Recordable,
  RouteRuleSetIds: Recordable,
  DnsServersIds: Recordable,
): DnsRuleConfig[] => {
  return rules.flatMap((raw: Recordable, i) => {
    const rule = createDnsRule()
    rule.id = 'rule-' + i
    rule.action = raw.action || DnsRuleAction.Route

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
          client_subnet: undefined,
          disable_cache: undefined,
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

    if (DnsRuleAction.Route === raw.action) {
      if ('server' in raw) {
        rule.server = DnsServersIds[raw.server]
      }
      if ('strategy' in raw) {
        rule.strategy = raw.strategy
      }
    } else if (DnsRuleAction.Reject === raw.action) {
      if ('method' in raw) {
        rule.server = raw.method
      }
    } else if ([DnsRuleAction.RouteOptions, DnsRuleAction.Predefined].includes(raw.action)) {
      rule.server = JSON.stringify(
        {
          ...raw,
          action: undefined,
          invert: undefined,
          disable_cache: undefined,
          client_subnet: undefined,
          strategy: undefined,
          server: undefined,
          ...supportedRuleTypes.reduce((p, c) => ((p[c] = undefined), p), {} as Recordable),
        },
        null,
        2,
      )
    }
    if ([DnsRuleAction.Route, DnsRuleAction.RouteOptions].includes(raw.action)) {
      if ('disable_cache' in raw) {
        rule.disable_cache = raw.disable_cache
      }
      if ('client_subnet' in raw) {
        rule.client_subnet = raw.client_subnet
      }
    }
    if ('invert' in raw) {
      rule.invert = raw.invert
    }
    return rule
  })
}
