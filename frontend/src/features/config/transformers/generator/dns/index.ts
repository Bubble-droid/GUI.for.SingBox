import { DomainStrategy, DnsServer, Outbound, DnsRuleType, DnsRuleAction } from '@/enums'
import { deepAssign } from '@/utils'

import type {
  DnsConfig,
  InboundConfig,
  OutboundConfig,
  RuleSetConfig,
} from '@/features/config/types'

import { _generateRule } from '../shared'

export * from './servers'

export const generateDns = (
  dns: DnsConfig,
  rule_set: RuleSetConfig[],
  inbounds: InboundConfig[],
  outbounds: OutboundConfig[],
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const extra: Recordable = {}
  if (dns.strategy !== DomainStrategy.Default) {
    extra.strategy = dns.strategy
  }
  if (dns.client_subnet) {
    extra.client_subnet = dns.client_subnet
  }
  return {
    servers: dns.servers.flatMap((server) => {
      const extra: Recordable = {}
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
        ].includes(server.type as any)
      ) {
        if (server.detour) {
          const outbound = getOutbound(server.detour)
          if (outbound?.type !== Outbound.Direct) {
            extra.detour = outbound?.tag
          }
        }
        server.domain_resolver && (extra.domain_resolver = getDnsServer(server.domain_resolver))
        if (
          [
            DnsServer.Tcp,
            DnsServer.Udp,
            DnsServer.Tls,
            DnsServer.Quic,
            DnsServer.Https,
            DnsServer.H3,
          ].includes(server.type as any)
        ) {
          server.server_port && (extra.server_port = Number(server.server_port))
          extra.server = server.server
          if ([DnsServer.Https, DnsServer.H3].includes(server.type as any)) {
            server.path && (extra.path = server.path)
          }
        }
      }
      if (server.type === DnsServer.Hosts) {
        extra.path = server.hosts_path.reduce((p, c) => p.concat(c.split(',')), [] as string[])
        extra.predefined = Object.entries(server.predefined).reduce(
          (p, [k, v]) => ({ ...p, [k]: v.split(',') }),
          {},
        )
      } else if (server.type === DnsServer.Dhcp) {
        server.interface && (extra.interface = server.interface)
      } else if (server.type === DnsServer.FakeIp) {
        server.inet4_range && (extra.inet4_range = server.inet4_range)
        server.inet6_range && (extra.inet6_range = server.inet6_range)
      }
      return {
        tag: server.tag,
        type: server.type,
        ...extra,
      }
    }),
    rules: dns.rules.flatMap((rule) => {
      if (rule.type === DnsRuleType.InsertionPoint || !rule.enable) {
        return []
      }
      const extra: Recordable = _generateRule(rule, rule_set, inbounds)
      if (rule.type === DnsRuleType.Inline && rule.payload.includes('__is_fake_ip')) {
        if (!dns.servers.find((v) => v.type === DnsServer.FakeIp)) {
          return []
        }
        delete extra.__is_fake_ip
      }
      if ([DnsRuleAction.Route, DnsRuleAction.RouteOptions].includes(rule.action as any)) {
        rule.disable_cache && (extra.disable_cache = rule.disable_cache)
        rule.client_subnet && (extra.client_subnet = rule.client_subnet)
        if (rule.action === DnsRuleAction.Route) {
          extra.server = getDnsServer(rule.server)
          if (rule.strategy !== DomainStrategy.Default) {
            // extra.strategy = rule.strategy
          }
        }
      }
      if ([DnsRuleAction.RouteOptions, DnsRuleAction.Predefined].includes(rule.action as any)) {
        deepAssign(extra, JSON.parse(rule.server))
      }
      if (rule.action === DnsRuleAction.Reject) {
        extra.method = rule.server
      }
      return extra
    }),
    disable_cache: dns.disable_cache,
    disable_expire: dns.disable_expire,
    independent_cache: dns.independent_cache,
    final: getDnsServer(dns.final),
    ...extra,
  }
}
