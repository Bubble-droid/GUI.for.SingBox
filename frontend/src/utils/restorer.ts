import {
  getDefaultDialer,
  getDefaultDns,
  getDefaultDnsRouteOptions,
  getDefaultDnsServer,
  getDefaultDomainResolver,
  getDefaultEndpoint,
  getDefaultExperimental,
  getDefaultHttpClient,
  getDefaultInbound,
  getDefaultListen,
  getDefaultLog,
  getDefaultMixin,
  getDefaultNtp,
  getDefaultOutbound,
  getDefaultRoute,
  getDefaultRouteOptions,
  getDefaultRuleSet,
  getDefaultScript,
  getDefaultService,
} from '@/constant'
import {
  CommonRuleType,
  DnsRcode,
  DnsRejectMethod,
  DnsRuleAction,
  DnsRuleType,
  DnsServer,
  Endpoint,
  Inbound,
  Outbound,
  OutboundMember,
  RouteRejectMethod,
  RouteRuleAction,
  RouteRuleType,
  RuleSetFormat,
  RuleSetType,
  RuleType,
  Service,
} from '@/enums'
import { useEnvStore, useRulesetsStore, useSubscribesStore } from '@/stores'
import {
  createTextMatcher,
  ensureArray,
  extractProps,
  getValues,
  sampleID,
  strictEntries,
} from '@/utils'

import type {
  CoreConfig,
  CoreDnsConfig,
  CoreDnsDefaultRule,
  CoreDnsLogicalRule,
  CoreDnsRuleConfig,
  CoreDnsServerConfig,
  CoreDnsServerOf,
  CoreDomainResolver,
  CoreEndpointConfig,
  CoreExperimentalConfig,
  CoreHttpClientConfig,
  CoreInboundConfig,
  CoreInboundOf,
  CoreOutboundConfig,
  CoreOutboundOf,
  CoreRouteConfig,
  CoreRouteRuleConfig,
  CoreRuleSetConfig,
  CoreServiceConfig,
  CoreServiceOf,
  Dialer,
  DnsProfile,
  DnsRuleConditionUnion,
  DnsRuleItem,
  DnsRuleProfile,
  DnsServerProfile,
  DomainResolver,
  EndpointProfile,
  ExperimentalProfile,
  HttpClientProfile,
  InboundAuthProfile,
  InboundNetworkProfile,
  InboundProfile,
  InboundTunProfile,
  Listen,
  LogProfile,
  OutboundGroupProfile,
  OutboundProfile,
  Profile,
  Recordable,
  RouteProfile,
  RouteRuleProfile,
  RuleSetProfile,
  RuleSetRemoteProfile,
  ServiceProfile,
  Subscription,
} from '@/types'

interface RestoreProfileOptions {
  profile?: Profile
  subscriptionIds?: string[]
}

interface IdMaps {
  endPoints: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  ruleSets: Map<string, string>
  dnsServers: Map<string, string>
  httpClients: Map<string, string>
}

const buildTagIdMapping = (prefix: string, arr: { tag?: string }[] = []): Map<string, string> => {
  return new Map(
    arr.flatMap((v, i) => {
      if (!v.tag) return []
      return [[v.tag, `${prefix}${i}`]]
    }),
  )
}

const buildRuleSetMapping = (
  prefix: string,
  arr: CoreRuleSetConfig[] = [],
): Map<string, string> => {
  return new Map(
    arr.flatMap((v, i) => {
      if (v.type !== RuleSetType.Remote) return [[ensureArray(v.tag)[0]!, `${prefix}${i}`]]
      return ensureArray(v.tag).map((tag, subIndex) => {
        return [tag, `${prefix}${i}_${subIndex}`]
      })
    }),
  )
}

const restoreListen = <T extends object>(
  raw: T,
  maps: IdMaps,
): {
  listen: Listen
  rest: Omit<T, keyof Listen>
} => {
  const template = getDefaultListen()
  const result = extractProps(raw, template)
  const owned = result.owned as unknown as CoreInboundOf<'mixed'>
  const listen: Listen = {
    ...template,
    ...owned,
    detour: maps.inbounds.get(owned.detour ?? '') ?? '',
  }
  return { listen, rest: result.rest }
}

const restoreDomainResolver = (raw: CoreDomainResolver, maps: IdMaps): DomainResolver => {
  const template = getDefaultDomainResolver()
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

const restoreDialer = <T extends object>(
  raw: T,
  maps: IdMaps,
): {
  dialer: Dialer
  rest: Omit<T, keyof Dialer>
} => {
  const template = getDefaultDialer()
  const result = extractProps(raw, template)
  const owned = result.owned as unknown as CoreOutboundOf<'direct'>
  const resolver = restoreDomainResolver(owned.domain_resolver as CoreDomainResolver, maps)
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

const restoreFields = (obj: Recordable) => {
  return Object.keys(obj).length > 0 ? JSON.stringify(obj, null, 2) : '{}'
}

const restoreNtp = (raw: CoreConfig['ntp'], maps: IdMaps): Profile['ntp'] => {
  const template = getDefaultNtp()
  const { dialer, rest } = restoreDialer(raw ?? {}, maps)
  return {
    ...template,
    ...rest,
    dialer,
  }
}

const restoreExperimental = (
  raw: CoreExperimentalConfig = {},
  maps: IdMaps,
): ExperimentalProfile => {
  const template = getDefaultExperimental()
  const { clash_api, cache_file } = raw

  return {
    clash_api: {
      ...template.clash_api,
      ...clash_api,
      access_control_allow_origin: ensureArray(clash_api?.access_control_allow_origin),
      external_ui_download_detour:
        maps.outbounds.get(clash_api?.external_ui_download_detour ?? '') ?? '',
    },
    cache_file: {
      ...template.cache_file,
      ...cache_file,
    },
  }
}

const restoreEndpoints = (
  endpoints: CoreEndpointConfig[] = [],
  maps: IdMaps,
): EndpointProfile[] => {
  return endpoints.map((raw): EndpointProfile => {
    const { type, tag, ...rest } = raw
    const id = maps.endPoints.get(tag) ?? sampleID()
    const base = {
      id,
      tag,
    }
    const template = getDefaultEndpoint(type)
    if (type === Endpoint.OpenvpnServer) {
      const { listen, rest: fields } = restoreListen(rest, maps)
      return {
        ...template,
        ...base,
        type,
        config: { listen },
        fields: restoreFields(fields),
      }
    } else {
      const { dialer, rest: fields } = restoreDialer(rest, maps)

      return {
        ...template,
        ...base,
        type,
        config: { dialer },
        fields: restoreFields(fields),
      }
    }
  })
}

const restoreServices = (services: CoreServiceConfig[] = [], maps: IdMaps): ServiceProfile[] => {
  return services.map((raw): ServiceProfile => {
    const { type, tag, ...rest } = raw
    const id = sampleID()

    const base = {
      id,
      tag,
    }

    switch (type) {
      case Service.Api: {
        const template = getDefaultService(type)
        const { config } = template
        const { listen, rest: fields } = restoreListen(rest, maps)
        const result = extractProps(fields, config)
        const owned = result.owned as CoreServiceOf<typeof Service.Api>
        const dashboard =
          typeof owned.dashboard === 'boolean'
            ? { ...config.dashboard, enabled: owned.dashboard }
            : typeof owned.dashboard === 'string'
              ? {
                  ...config.dashboard,
                  path: owned.dashboard,
                }
              : { ...config.dashboard, ...owned.dashboard }

        return {
          ...template,
          ...base,
          type,
          config: {
            ...config,
            ...owned,
            access_control_allow_origin: ensureArray(owned.access_control_allow_origin),
            listen,
            dashboard: {
              ...dashboard,
              http_client: maps.httpClients.get(dashboard.http_client as string) ?? '',
            },
          },
          fields: restoreFields(result.rest),
        }
      }

      case Service.UsbipClient: {
        const template = getDefaultService(type)
        const { dialer, rest: fields } = restoreDialer(rest, maps)
        return {
          ...template,
          ...base,
          type,
          config: { dialer },
          fields: restoreFields(fields),
        }
      }

      default: {
        const template = getDefaultService(type)
        const { listen, rest: fields } = restoreListen(rest, maps)
        return {
          ...template,
          ...base,
          type,
          config: { listen },
          fields: restoreFields(fields),
        }
      }
    }
  })
}

const restoreHttpClients = (
  httpClients: CoreHttpClientConfig[] = [],
  maps: IdMaps,
): HttpClientProfile[] => {
  return httpClients.map((raw): HttpClientProfile => {
    const { tag, ...rest } = raw
    const id = maps.httpClients.get(tag) ?? sampleID()

    const { dialer, rest: fields } = restoreDialer(rest, maps)
    const template = getDefaultHttpClient()

    return {
      ...template,
      id,
      tag,
      config: {
        dialer,
      },
      fields: restoreFields(fields),
    }
  })
}

const restoreInbounds = (inbounds: CoreInboundConfig[] = [], maps: IdMaps): InboundProfile[] => {
  return inbounds.map((raw): InboundProfile => {
    const { type, tag, ...rest } = raw
    const id = maps.inbounds.get(tag) ?? sampleID()
    const base = {
      id,
      tag,
    }
    const template = getDefaultInbound(type)
    switch (type) {
      case Inbound.Tun: {
        const result = extractProps(rest, template.config)
        const owned = result.owned as InboundTunProfile['config']

        return {
          ...template,
          ...base,
          type,
          config: {
            ...template.config,
            ...owned,
            address: ensureArray(owned.address),
            dns_address: ensureArray(owned.dns_address),
            route_address: ensureArray(owned.route_address),
            route_exclude_address: ensureArray(owned.route_exclude_address),
            route_address_set: ensureArray(owned.route_address_set).map(
              (v) => maps.ruleSets.get(v) ?? '',
            ),
            route_exclude_address_set: ensureArray(owned.route_exclude_address_set).map(
              (v) => maps.ruleSets.get(v) ?? '',
            ),
            include_interface: ensureArray(owned.include_interface),
            exclude_interface: ensureArray(owned.exclude_interface),
          },
          fields: restoreFields(result.rest),
        }
      }

      case Inbound.Mixed:
      case Inbound.Socks:
      case Inbound.Http: {
        const result = restoreListen(rest, maps)
        const { users, ...fields } = result.rest as CoreInboundOf<InboundAuthProfile['type']>

        return {
          ...template,
          ...base,
          type,
          config: {
            listen: result.listen,
            users: ensureArray(users).reduce<Recordable<string>>((p, c) => {
              p[c.username] = c.password
              return p
            }, {}),
          },
          fields: restoreFields(fields),
        }
      }

      case Inbound.Direct:
      case Inbound.Tproxy: {
        const result = restoreListen(rest, maps)
        const { network = '', ...fields } = result.rest as CoreInboundOf<
          InboundNetworkProfile['type']
        >

        return {
          ...template,
          id,
          type,
          tag,
          config: {
            listen: result.listen,
            network: network as InboundNetworkProfile['config']['network'],
          },
          fields: restoreFields(fields),
        }
      }

      default: {
        const { listen, rest: fields } = restoreListen(rest, maps)
        return {
          ...template,
          ...base,
          type,
          config: { listen },
          fields: restoreFields(fields),
        }
      }
    }
  })
}

const restoreOutbounds = (
  outbounds: CoreOutboundConfig[] = [],
  maps: IdMaps,
  originalOutbounds: OutboundProfile[] = [],
  subscriptionIds: string[],
): OutboundProfile[] => {
  const subscribesStore = useSubscribesStore()

  const subscriptionCache = new Map<string, Subscription>()
  const proxyToSubMap = new Map<string, { subId: string; proxyId: string }>()
  const originalOutboundMap = new Map<string, OutboundProfile>(
    originalOutbounds.map((v) => [v.tag, v]),
  )

  const builtInTags = new Set(
    outbounds.filter((o) => getValues(Outbound).includes(o.type as Outbound)).map((v) => v.tag),
  )

  subscriptionIds.forEach((id) => {
    const sub = subscribesStore.getSubscribeById(id)
    if (sub) {
      subscriptionCache.set(id, sub)
      sub.proxies.forEach((proxy) => {
        proxyToSubMap.set(proxy.tag, { subId: sub.id, proxyId: proxy.id })
      })
    }
  })

  return outbounds.flatMap((raw): OutboundProfile[] => {
    const { type, tag, ...rest } = raw
    const id = maps.outbounds.get(tag) ?? sampleID()

    const base = {
      id,
      tag,
    }

    if (!builtInTags.has(tag)) {
      return []
    }

    const template = getDefaultOutbound(type as Outbound)

    switch (type) {
      case Outbound.Urltest:
      case Outbound.Selector: {
        let newMembers: OutboundGroupProfile['outbounds'] = []
        raw.outbounds.forEach((t) => {
          const epId = maps.endPoints.get(t)
          const proxy = proxyToSubMap.get(t)
          if (builtInTags.has(t)) {
            newMembers.push({
              id: maps.outbounds.get(t) ?? t,
              type: OutboundMember.BuiltIn,
              tag: t,
            })
          } else if (epId) {
            newMembers.push({
              id: epId,
              type: OutboundMember.Endpoint,
              tag: t,
            })
          } else if (proxy) {
            newMembers.push({
              id: proxy.proxyId,
              subId: proxy.subId,
              type: OutboundMember.Proxy,
              tag: t,
            })
          }
        })

        const originalGroup = originalOutboundMap.get(tag) as OutboundGroupProfile | undefined
        const groupFields: OutboundGroupProfile = {
          outbounds: [],
          include: originalGroup?.include ?? '',
          exclude: originalGroup?.exclude ?? '',
          icon: originalGroup?.icon ?? '',
          hidden: originalGroup?.hidden ?? false,
        }

        const currentNonBuiltInIds = new Set(
          newMembers.filter((v) => v.type !== OutboundMember.BuiltIn).map((v) => v.id),
        )

        subscriptionIds.forEach((id) => {
          const sub = subscriptionCache.get(id)
          if (sub) {
            const isTagMatching = createTextMatcher(groupFields.include, groupFields.exclude)
            const matchedProxies = sub.proxies.filter((proxy) => isTagMatching(proxy.tag))

            const isAllMatched =
              matchedProxies.length > 0 &&
              matchedProxies.every((proxy) => currentNonBuiltInIds.has(proxy.id))

            if (isAllMatched) {
              const matchedIds = new Set(matchedProxies.map((p) => p.id))
              newMembers = newMembers.filter(
                (v) => v.type === OutboundMember.BuiltIn || !matchedIds.has(v.id),
              )
              newMembers.push({ id: sub.id, type: OutboundMember.Subscription, tag: sub.name })

              matchedIds.forEach((matchedId) => currentNonBuiltInIds.delete(matchedId))
            }
          }
        })

        const result = extractProps(rest, template.config)

        return [
          {
            ...template,
            ...groupFields,
            ...base,
            type,
            outbounds: newMembers,
            config: {
              ...(template.config as any),
              ...result.owned,
            },
          },
        ]
      }

      case Outbound.Direct: {
        const { dialer } = restoreDialer(rest, maps)
        return [
          {
            ...template,
            ...base,
            type,
            config: {
              dialer,
            },
          },
        ]
      }

      case Outbound.Bridge: {
        const result = extractProps(rest, template.config)

        return [
          {
            ...template,
            ...base,
            type,
            config: {
              ...template.config,
              ...(result.owned as any),
            },
          },
        ]
      }

      case Outbound.Block: {
        return [
          {
            ...template,
            ...base,
            type,
          },
        ]
      }

      default: {
        return []
      }
    }
  })
}

const restoreRuleSets = (rulesets: CoreRuleSetConfig[], maps: IdMaps): RuleSetProfile[] => {
  const { env } = useEnvStore()
  const rulesetsStore = useRulesetsStore()

  return rulesets.map((raw): RuleSetProfile => {
    const { type, tag, ...rest } = raw
    const id = maps.ruleSets.get(tag as string) ?? sampleID()
    const base = {
      id,
      tag: tag as string,
    }
    const template = getDefaultRuleSet(type)

    switch (type) {
      case RuleSetType.Inline: {
        return {
          ...template,
          ...base,
          type,
          config: {
            rules: JSON.stringify(raw.rules ?? [], null, 2),
          },
        }
      }

      case RuleSetType.Local: {
        const ruleset = rulesetsStore.rulesets.find(
          (r) => r.path === raw.path.replace(`${env.appDataPath}/`, 'data/'),
        )
        return {
          ...template,
          ...base,
          type,
          config: {
            path: ruleset?.id ?? raw.path,
            format: raw.format ?? RuleSetFormat.Binary,
          },
        }
      }

      default: {
        const result = extractProps(rest, template.config)
        const owned = result.owned as RuleSetRemoteProfile['config']
        const tags = ensureArray(tag)
        const mainId = maps.ruleSets.get(tags[0]!)!.split('_')[0]!
        return {
          ...template,
          ...base,
          id: mainId,
          tag: tags,
          type,
          config: {
            ...template.config,
            ...owned,
            http_client: maps.httpClients.get(owned.http_client) ?? '',
          },
        }
      }
    }
  })
}

const SupportedRules = new Set([...Object.values(RouteRuleType), ...Object.values(DnsRuleType)])

const restoreRuleConditions = (
  rule: CoreDnsDefaultRule | CoreDnsLogicalRule,
  maps: IdMaps,
): Omit<DnsRuleConditionUnion, 'id' | 'enable' | 'fields'> => {
  if (rule.type === 'logical') {
    const rules = ensureArray(rule.rules).map((r) => restoreRuleConditions(r, maps))
    return {
      type: RuleType.Logical,
      ruleConditions: {
        mode: rule.mode,
        rules: rules.map((r) => ({
          conditions: r.ruleConditions as DnsRuleItem[],
        })),
      },
    }
  }

  const items: DnsRuleItem[] = []

  for (const [k, v] of strictEntries(rule)) {
    if (!SupportedRules.has(k as any)) continue

    let mappedValue: any
    switch (k) {
      case DnsRuleType.Inbound: {
        mappedValue = ensureArray(v).map((t) => maps.inbounds.get(t))
        break
      }

      case DnsRuleType.RuleSet: {
        mappedValue = ensureArray(v).map((t) => maps.ruleSets.get(t))
        break
      }

      case CommonRuleType.InterfaceAddress:
      case CommonRuleType.NetworkInterfaceAddress: {
        const rec: Recordable<string> = {}
        for (const [key, val] of Object.entries(v!)) {
          rec[key] = ensureArray(val).join(',')
        }
        mappedValue = rec
        break
      }

      case CommonRuleType.IpVersion: {
        mappedValue = String(v)
        break
      }

      case CommonRuleType.UserId:
      case CommonRuleType.SourcePort:
      case CommonRuleType.Port: {
        mappedValue = ensureArray(v).map(String)
        break
      }

      default: {
        if (typeof v === 'string' || typeof v === 'boolean') {
          mappedValue = v
        } else {
          mappedValue = ensureArray(v).map(String)
        }
      }
    }

    items.push({ type: k as any, value: mappedValue })
  }

  return {
    type: RuleType.Default,
    ruleConditions: items,
  }
}

const restoreRouteRules = (rules: CoreRouteRuleConfig[], maps: IdMaps): RouteRuleProfile[] => {
  return rules.map((raw): RouteRuleProfile => {
    const { action } = raw

    const { type, ruleConditions } = restoreRuleConditions(raw as CoreDnsDefaultRule, maps)
    const options = getDefaultRouteOptions()
    let actionParams: Recordable = {}

    switch (action) {
      case RouteRuleAction.Route:
      case RouteRuleAction.Bypass: {
        const { owned: optArgs } = extractProps(raw, options)
        actionParams = {
          outbound: maps.outbounds.get(raw.outbound) ?? '',
          options: {
            ...options,
            ...optArgs,
          },
        }
        break
      }
      case RouteRuleAction.RouteOptions: {
        const { owned: optArgs } = extractProps(raw, options)
        actionParams = {
          ...options,
          ...optArgs,
        }
        break
      }
      case RouteRuleAction.Reject:
        actionParams = {
          method: raw.method ?? RouteRejectMethod.Default,
          no_drop: raw.no_drop ?? false,
        }
        break
      case RouteRuleAction.Sniff:
        actionParams = {
          sniffer: ensureArray(raw.sniffer),
        }
        break
      case RouteRuleAction.Resolve: {
        actionParams = restoreDomainResolver(raw as CoreDomainResolver, maps)
        break
      }
      case RouteRuleAction.HijackDns:
        actionParams = {}
        break
    }

    return {
      id: sampleID(),
      enable: true,
      fields: '{}',
      type,
      ruleConditions,
      action,
      actionParams,
    } as RouteRuleProfile
  })
}

const restoreRoute = (rawRoute: CoreRouteConfig | undefined, maps: IdMaps): RouteProfile => {
  const routeBase = getDefaultRoute()
  if (!rawRoute) return routeBase

  const defaultDomainResolver = restoreDomainResolver(
    rawRoute.default_domain_resolver as CoreDomainResolver,
    maps,
  )

  const { owned, rest: routeFields } = extractProps(rawRoute, routeBase)

  return {
    ...routeBase,
    ...owned,
    default_domain_resolver: defaultDomainResolver,
    final: maps.outbounds.get(rawRoute.final ?? '') ?? '',
    default_http_client: maps.httpClients.get(rawRoute.default_http_client ?? '') ?? '',

    rule_set: restoreRuleSets(rawRoute.rule_set ?? [], maps),
    rules: restoreRouteRules(rawRoute.rules ?? [], maps),
    fields: restoreFields(routeFields),
  }
}

const restoreDnsServers = (servers: CoreDnsServerConfig[], maps: IdMaps): DnsServerProfile[] => {
  return servers.map((raw): DnsServerProfile => {
    const { type, tag, ...rest } = raw
    const id = maps.dnsServers.get(tag) ?? sampleID()

    const base = {
      id,
      tag,
    }

    switch (type) {
      case DnsServer.Local: {
        const { dialer, rest: fields } = restoreDialer(rest as CoreDnsServerOf<'local'>, maps)
        const template = getDefaultDnsServer(type)
        return {
          ...template,
          ...base,
          type,
          config: {
            dialer,
            prefer_go: !!fields.prefer_go,
            neighbor_domain: ensureArray(fields.neighbor_domain),
          },
        }
      }

      case DnsServer.Hosts: {
        const template = getDefaultDnsServer(type)

        return {
          ...template,
          ...base,
          type,
          config: {
            path: ensureArray(raw.path),
            predefined: Object.entries(raw.predefined ?? {}).reduce<Recordable<string>>(
              (acc, [k, v]) => {
                acc[k] = ensureArray(v).join(',')
                return acc
              },
              {},
            ),
          },
        }
      }

      case DnsServer.Tcp:
      case DnsServer.Udp:
      case DnsServer.Tls:
      case DnsServer.Quic:
      case DnsServer.Https:
      case DnsServer.H3: {
        const template = getDefaultDnsServer(type)
        const { dialer, rest: nonDialer } = restoreDialer(rest, maps)
        const { rest: fields } = extractProps(nonDialer, template.config)
        const serverConfig = {
          dialer,
          server: raw.server ?? '',
          server_port: raw.server_port ?? 0,
        }
        if (type === DnsServer.Https || type === DnsServer.H3) {
          return {
            ...template,
            ...base,
            type,
            config: {
              ...serverConfig,
              path: raw.path ?? '',
            },
            fields: restoreFields(fields),
          }
        }
        return {
          ...template,
          ...base,
          type,
          config: serverConfig,
          fields: restoreFields(fields),
        } as DnsServerProfile
      }

      case DnsServer.Dhcp: {
        const { dialer, rest: fields } = restoreDialer(rest as CoreDnsServerOf<'dhcp'>, maps)

        return {
          ...base,
          type,
          config: {
            dialer,
            interface: fields.interface ?? '',
          },
          fields: restoreFields(fields),
        }
      }

      case DnsServer.FakeIp: {
        const template = getDefaultDnsServer(type)

        return {
          ...template,
          ...base,
          type,
          config: {
            inet4_range: raw.inet4_range ?? template.config.inet4_range,
            inet6_range: raw.inet6_range ?? template.config.inet6_range,
          },
        }
      }

      case DnsServer.Mdns: {
        const { dialer, rest: fields } = restoreDialer(rest as CoreDnsServerOf<'mdns'>, maps)
        const template = getDefaultDnsServer(type)
        return {
          ...template,
          ...base,
          type,
          config: {
            dialer,
          },
          fields: restoreFields(fields),
        }
      }

      default: {
        const template = getDefaultDnsServer(type)
        return {
          ...template,
          ...base,
          type,
          config: {},
          fields: restoreFields(rest),
        }
      }
    }
  })
}

const restoreDnsRules = (rules: CoreDnsRuleConfig[], maps: IdMaps): DnsRuleProfile[] => {
  return rules.map((raw) => {
    const { action } = raw

    const { type, ruleConditions } = restoreRuleConditions(raw, maps)

    let actionParams: Recordable = {}

    switch (action) {
      case DnsRuleAction.Route:
      case DnsRuleAction.Evaluate: {
        actionParams = restoreDomainResolver(raw, maps)
        break
      }
      case DnsRuleAction.RouteOptions: {
        const options = getDefaultDnsRouteOptions()
        const { owned: optArgs } = extractProps(raw, options)
        actionParams = {
          ...options,
          ...optArgs,
        }
        break
      }
      case DnsRuleAction.Reject:
        actionParams = {
          method: raw.method ?? DnsRejectMethod.Default,
          no_drop: !!raw.no_drop,
        }
        break
      case DnsRuleAction.Predefined:
        actionParams = {
          rcode: raw.rcode ?? DnsRcode.NOERROR,
          answer: ensureArray(raw.answer),
        }
        break
      case DnsRuleAction.Respond:
        actionParams = {}
        break
    }

    return {
      id: sampleID(),
      enable: true,
      fields: '{}',
      type,
      ruleConditions,
      action,
      actionParams,
    } as DnsRuleProfile
  })
}

const restoreDns = (rawDns: CoreDnsConfig | undefined, maps: IdMaps): DnsProfile => {
  const dnsBase = getDefaultDns()
  if (!rawDns) return dnsBase

  const { owned, rest: dnsFields } = extractProps(rawDns, dnsBase)

  return {
    ...dnsBase,
    ...owned,
    final: maps.dnsServers.get(rawDns.final ?? '') ?? '',
    servers: restoreDnsServers((rawDns.servers ?? []) as CoreDnsServerConfig[], maps),
    rules: restoreDnsRules(rawDns.rules ?? [], maps),
    fields: restoreFields(dnsFields),
  } as DnsProfile
}

export const restoreProfile = (
  config: CoreConfig,
  name = sampleID(),
  options: RestoreProfileOptions = {},
): Profile => {
  const { profile, subscriptionIds = [] } = options

  const endPointIds = buildTagIdMapping('ep-', config.endpoints)
  const inboundIds = buildTagIdMapping('in-', config.inbounds)
  const outboundIds = buildTagIdMapping('out-', config.outbounds)

  const maps: IdMaps = {
    endPoints: endPointIds,
    httpClients: buildTagIdMapping('http-', config.http_clients),
    inbounds: new Map([...endPointIds, ...inboundIds]),
    outbounds: new Map([...endPointIds, ...outboundIds]),
    ruleSets: buildRuleSetMapping('ruleset-', config.route?.rule_set),
    dnsServers: buildTagIdMapping('dns-', config.dns?.servers),
  }

  return {
    id: profile?.id ?? sampleID(),
    name,
    log: { ...getDefaultLog(), ...(config.log as LogProfile) },
    ntp: restoreNtp(config.ntp, maps),
    experimental: restoreExperimental(config.experimental, maps),
    endpoints: restoreEndpoints(config.endpoints as any, maps),
    services: restoreServices(config.services, maps),
    http_clients: restoreHttpClients(config.http_clients, maps),
    inbounds: restoreInbounds(config.inbounds, maps),
    outbounds: restoreOutbounds(
      config.outbounds as CoreOutboundConfig[],
      maps,
      profile?.outbounds,
      subscriptionIds,
    ),
    route: restoreRoute(config.route, maps),
    dns: restoreDns(config.dns, maps),
    mixin: profile?.mixin ?? getDefaultMixin(),
    script: profile?.script ?? getDefaultScript(),
  }
}
