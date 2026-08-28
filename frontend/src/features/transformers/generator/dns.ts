import { DnsServer, Outbound, DnsRuleType, DnsRuleAction } from '@features/constant/kernel'
import type { DnsServerConfig, DnsConfig } from '@profiles/dns'
import type { InboundConfig } from '@profiles/inbounds'
import type { OutboundConfig } from '@profiles/outbounds'
import type { RuleSetConfig } from '@profiles/route'

import { deepAssign } from '@/utils/others'

import { generateRule } from './shared'

export const generateDnsServerURL = (dnsServer: DnsServerConfig) => {
  const { type, server_port, path, server, interface: _interface } = dnsServer
  switch (type) {
    case DnsServer.Https: {
      return `https://${server}${server_port ? `:${server_port}` : ''}${path || ''}`
    }
    case DnsServer.H3: {
      return `h3://${server}${server_port ? `:${server_port}` : ''}${path || ''}`
    }
    case DnsServer.Dhcp: {
      return `dhcp://${_interface}`
    }
    case DnsServer.FakeIp: {
      return `fake-ip://${
        dnsServer.inet4_range || ''
      }${dnsServer.inet6_range ? (dnsServer.inet4_range ? ',' : '') + dnsServer.inet6_range : ''}`
    }
    case DnsServer.Quic:
    case DnsServer.Tcp:
    case DnsServer.Udp:
    case DnsServer.Tls: {
      return `${type}://${server}${server_port ? `:${server_port}` : ''}`
    }
    default: {
      return type
    }
  }
}

export const generateDns = (
  dns: DnsConfig,
  rule_set: RuleSetConfig[],
  inbounds: InboundConfig[],
  outbounds: OutboundConfig[],
) => {
  const getOutbound = (id: string) => outbounds.find((v) => v.id === id)
  const getDnsServer = (id: string) => dns.servers.find((v) => v.id === id)?.tag
  const dnsExtra: Recordable = {}
  if (dns.strategy) {
    dnsExtra['strategy'] = dns.strategy
  }
  if (dns.client_subnet) {
    dnsExtra['client_subnet'] = dns.client_subnet
  }
  return {
    servers: dns.servers.flatMap((server) => {
      const extra: Recordable = {}
      if (
        (
          [
            DnsServer.Local,
            DnsServer.Tcp,
            DnsServer.Udp,
            DnsServer.Tls,
            DnsServer.Quic,
            DnsServer.Https,
            DnsServer.H3,
            DnsServer.Dhcp,
          ] as DnsServer[]
        ).includes(server.type)
      ) {
        if (server.detour) {
          const outbound = getOutbound(server.detour)
          if (outbound?.type !== Outbound.Direct) {
            extra['detour'] = outbound?.tag
          }
        }
        server.domain_resolver && (extra['domain_resolver'] = getDnsServer(server.domain_resolver))
        if (
          (
            [
              DnsServer.Tcp,
              DnsServer.Udp,
              DnsServer.Tls,
              DnsServer.Quic,
              DnsServer.Https,
              DnsServer.H3,
            ] as DnsServer[]
          ).includes(server.type)
        ) {
          server.server_port && (extra['server_port'] = Number(server.server_port))
          extra['server'] = server.server
          if (([DnsServer.Https, DnsServer.H3] as DnsServer[]).includes(server.type)) {
            server.path && (extra['path'] = server.path)
          }
        }
      }
      switch (server.type) {
        case DnsServer.Hosts: {
          extra['path'] = server.hosts_path.flatMap((v) => v.split(','))
          extra['predefined'] = Object.fromEntries(
            Object.entries(server.predefined).map(([k, v]) => [k, v.split(',')]),
          )
          break
        }
        case DnsServer.Dhcp: {
          server.interface && (extra['interface'] = server.interface)
          break
        }
        case DnsServer.FakeIp: {
          server.inet4_range && (extra['inet4_range'] = server.inet4_range)
          server.inet6_range && (extra['inet6_range'] = server.inet6_range)
          break
        }
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
      const extra: Recordable = generateRule(rule, rule_set, inbounds)
      if (rule.type === DnsRuleType.Inline && rule.payload.includes('__is_fake_ip')) {
        if (!dns.servers.some((v) => v.type === DnsServer.FakeIp)) {
          return []
        }
        delete extra['__is_fake_ip']
      }
      if (
        ([DnsRuleAction.Route, DnsRuleAction.RouteOptions] as DnsRuleAction[]).includes(rule.action)
      ) {
        rule.disable_cache && (extra['disable_cache'] = rule.disable_cache)
        rule.client_subnet && (extra['client_subnet'] = rule.client_subnet)
        if (rule.action === DnsRuleAction.Route) {
          extra['server'] = getDnsServer(rule.server)
        }
      }
      if (
        ([DnsRuleAction.RouteOptions, DnsRuleAction.Predefined] as DnsRuleAction[]).includes(
          rule.action,
        )
      ) {
        deepAssign(extra, JSON.parse(rule.server))
      }
      if (rule.action === DnsRuleAction.Reject) {
        extra['method'] = rule.server
      }
      return extra
    }),
    disable_cache: dns.disable_cache,
    disable_expire: dns.disable_expire,
    independent_cache: dns.independent_cache,
    final: getDnsServer(dns.final),
    ...dnsExtra,
  }
}
