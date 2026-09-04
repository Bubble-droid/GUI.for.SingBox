import { DnsActionKind, DnsRuleType, DnsServerType, OutboundType } from '@profile/constant/kernel'
import type { DnsSection, DnsServerItem } from '@profile/types/profiles/dns'
import type { InboundItem } from '@profile/types/profiles/inbounds'
import type { OutboundItem } from '@profile/types/profiles/outbounds'
import type { RuleSetItem } from '@profile/types/profiles/route'

import { deepAssign } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import { generateRuleItem } from './shared'

export const generateDnsServerURL = (dnsServer: DnsServerItem) => {
  const { type, server_port, path, server, interface: _interface } = dnsServer
  switch (type) {
    case DnsServerType.Https: {
      return `https://${server}${server_port ? `:${server_port}` : ''}${path || ''}`
    }
    case DnsServerType.H3: {
      return `h3://${server}${server_port ? `:${server_port}` : ''}${path || ''}`
    }
    case DnsServerType.Dhcp: {
      return `dhcp://${_interface}`
    }
    case DnsServerType.FakeIp: {
      return `fake-ip://${
        dnsServer.inet4_range || ''
      }${dnsServer.inet6_range ? (dnsServer.inet4_range ? ',' : '') + dnsServer.inet6_range : ''}`
    }
    case DnsServerType.Quic:
    case DnsServerType.Tcp:
    case DnsServerType.Udp:
    case DnsServerType.Tls: {
      return `${type}://${server}${server_port ? `:${server_port}` : ''}`
    }
    default: {
      return type
    }
  }
}

export const generateDns = (
  dns: DnsSection,
  rule_set: RuleSetItem[],
  inbounds: InboundItem[],
  outbounds: OutboundItem[],
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
            DnsServerType.Local,
            DnsServerType.Tcp,
            DnsServerType.Udp,
            DnsServerType.Tls,
            DnsServerType.Quic,
            DnsServerType.Https,
            DnsServerType.H3,
            DnsServerType.Dhcp,
          ] as DnsServerType[]
        ).includes(server.type)
      ) {
        if (server.detour) {
          const outbound = getOutbound(server.detour)
          if (outbound?.type !== OutboundType.Direct) {
            extra['detour'] = outbound?.tag
          }
        }
        server.domain_resolver && (extra['domain_resolver'] = getDnsServer(server.domain_resolver))
        if (
          (
            [
              DnsServerType.Tcp,
              DnsServerType.Udp,
              DnsServerType.Tls,
              DnsServerType.Quic,
              DnsServerType.Https,
              DnsServerType.H3,
            ] as DnsServerType[]
          ).includes(server.type)
        ) {
          server.server_port && (extra['server_port'] = Number(server.server_port))
          extra['server'] = server.server
          if (([DnsServerType.Https, DnsServerType.H3] as DnsServerType[]).includes(server.type)) {
            server.path && (extra['path'] = server.path)
          }
        }
      }
      switch (server.type) {
        case DnsServerType.Hosts: {
          extra['path'] = server.hosts_path.flatMap((v) => v.split(','))
          extra['predefined'] = Object.fromEntries(
            Object.entries(server.predefined).map(([k, v]) => [k, v.split(',')]),
          )
          break
        }
        case DnsServerType.Dhcp: {
          server.interface && (extra['interface'] = server.interface)
          break
        }
        case DnsServerType.FakeIp: {
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
      const extra: Recordable = generateRuleItem(rule, rule_set, inbounds)
      if (rule.type === DnsRuleType.Inline && rule.payload.includes('__is_fake_ip')) {
        if (!dns.servers.some((v) => v.type === DnsServerType.FakeIp)) {
          return []
        }
        delete extra['__is_fake_ip']
      }
      if (
        ([DnsActionKind.Route, DnsActionKind.RouteOptions] as DnsActionKind[]).includes(rule.action)
      ) {
        rule.disable_cache && (extra['disable_cache'] = rule.disable_cache)
        rule.client_subnet && (extra['client_subnet'] = rule.client_subnet)
        if (rule.action === DnsActionKind.Route) {
          extra['server'] = getDnsServer(rule.server)
        }
      }
      if (
        ([DnsActionKind.RouteOptions, DnsActionKind.Predefined] as DnsActionKind[]).includes(
          rule.action,
        )
      ) {
        deepAssign(extra, JSON.parse(rule.server))
      }
      if (rule.action === DnsActionKind.Reject) {
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
