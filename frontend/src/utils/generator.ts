import { parse } from 'yaml'

import { ReadFile, WriteFile } from '@/bridge'
import { CoreConfigFilePath } from '@/constant'
import {
  Branch,
  CommonRuleType,
  DnsRuleAction,
  DnsRuleType,
  DnsServer,
  Endpoint,
  Inbound,
  Outbound,
  OutboundMember,
  RouteRuleAction,
  RuleSetType,
  RuleType,
  Service,
} from '@/enums'
import {
  useAppSettingsStore,
  useEnvStore,
  usePluginsStore,
  useRulesetsStore,
  useSubscribesStore,
} from '@/stores'
import { APP_TITLE, createTextMatcher, deepAssign, deepClone, filterInvalidProps } from '@/utils'

import type {
  CoreConfig,
  CoreDialer,
  CoreDnsConfig,
  CoreDnsDefaultRule,
  CoreDnsLogicalRule,
  CoreDnsRuleConfig,
  CoreDnsServerConfig,
  CoreDnsServerOf,
  CoreDomainResolver,
  CoreEndpointConfig,
  CoreEndpointOf,
  CoreExperimentalConfig,
  CoreHttpClientConfig,
  CoreInboundConfig,
  CoreInboundOf,
  CoreListen,
  CoreNtpConfig,
  CoreOutboundConfig,
  CoreRouteConfig,
  CoreRouteDefaultRule,
  CoreRouteRuleConfig,
  CoreRuleSetConfig,
  CoreRuleSetOf,
  CoreServiceConfig,
  CoreServiceOf,
  Dialer,
  DnsProfile,
  DnsRuleItem,
  DnsRuleProfile,
  DnsServerProfile,
  EndpointProfile,
  ExperimentalProfile,
  HttpClientProfile,
  InboundProfile,
  Listen,
  NormalizeListableProps,
  NtpProfile,
  OutboundGroupProfile,
  OutboundProfile,
  Profile,
  Recordable,
  RouteProfile,
  RouteRuleProfile,
  RuleSetProfile,
  ServiceProfile,
  StandardDnsServerConfig,
  TagItem,
} from '@/types'

interface TagMaps {
  httpClients: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  ruleSets: Map<string, string>
  dnsServers: Map<string, string>
}

const buildIdTagMapping = (items: TagItem[]): Map<string, string> => {
  return new Map(items.map((v) => [v.id, v.tag]))
}

const buildRuleSetMapping = (items: RuleSetProfile[]): Map<string, string> => {
  return new Map(
    items.flatMap((v) => {
      if (v.type !== RuleSetType.Remote) return [[v.id, v.tag]]
      return v.tag.map((tag, i) => [`${v.id}_${i}`, tag])
    }),
  )
}

const generateListen = (listen: Listen, maps: TagMaps): CoreListen => {
  return {
    ...(listen as CoreListen),
    detour: maps.inbounds.get(listen.detour)!,
  }
}

const generateDomainResolver = (
  resolver: Dialer['domain_resolver'],
  maps: TagMaps,
): Extract<CoreDomainResolver, object> => {
  return filterInvalidProps({
    ...(resolver as Extract<CoreDomainResolver, object>),
    server: maps.dnsServers.get(resolver.server)!,
  })
}

const generateDialer = (dialer: Dialer, maps: TagMaps): CoreDialer => {
  return {
    ...(dialer as CoreDialer),
    detour: maps.outbounds.get(dialer.detour)!,
    domain_resolver: generateDomainResolver(dialer.domain_resolver, maps),
  }
}

const generateNtp = (ntp: NtpProfile, maps: TagMaps): CoreNtpConfig => {
  if (!ntp.enabled) return {} as CoreNtpConfig
  const { dialer, ...rest } = ntp
  return filterInvalidProps({
    ...(rest as CoreNtpConfig),
    ...generateDialer(dialer, maps),
  })
}

const generateExperimental = (
  experimental: ExperimentalProfile,
  maps: TagMaps,
): CoreExperimentalConfig => {
  const { clash_api, cache_file } = experimental
  return filterInvalidProps({
    clash_api: filterInvalidProps({
      ...clash_api,
      external_ui_download_detour: maps.outbounds.get(clash_api.external_ui_download_detour),
    }),
    cache_file: cache_file.enabled
      ? { ...filterInvalidProps(cache_file), enabled: true }
      : undefined,
  })
}

const generateEndpoints = (endpoints: EndpointProfile[], maps: TagMaps) => {
  return endpoints.flatMap((ep): CoreEndpointConfig[] => {
    const { enable, type, tag, config, fields } = ep
    if (!enable) return []
    if (type === Endpoint.OpenvpnServer) {
      return [
        filterInvalidProps({
          ...(JSON.parse(fields) as CoreEndpointOf<typeof Endpoint.OpenvpnServer>),
          ...generateListen(config.listen, maps),
          type,
          tag,
        }),
      ]
    } else {
      return [
        filterInvalidProps({
          ...JSON.parse(fields),
          ...generateDialer(config.dialer, maps),
          type,
          tag,
        } as CoreEndpointConfig),
      ]
    }
  })
}

const generateServices = (services: ServiceProfile[], maps: TagMaps) => {
  return services.flatMap((sr): CoreServiceConfig[] => {
    const { enable, type, tag, config, fields } = sr
    if (!enable) return []
    switch (type) {
      case Service.Api: {
        const { listen, dashboard, ...rest } = config
        return [
          filterInvalidProps({
            ...(JSON.parse(fields) as CoreServiceOf<typeof Service.Api>),
            ...generateListen(listen, maps),
            ...rest,
            type,
            tag,
            dashboard: dashboard.enabled
              ? filterInvalidProps({
                  ...dashboard,
                  http_client: maps.httpClients.get(dashboard.http_client) ?? '',
                } )
              : undefined,
          } as CoreServiceOf<typeof Service.Api>),
        ]
      }

      case Service.UsbipClient: {
        return [
          filterInvalidProps({
            ...(JSON.parse(fields) as CoreServiceOf<typeof Service.UsbipClient>),
            ...generateDialer(config.dialer, maps),
            type,
            tag,
          }),
        ]
      }

      default: {
        return [
          filterInvalidProps({
            ...JSON.parse(fields),
            ...generateListen(config.listen, maps),
            type,
            tag,
          } as CoreServiceConfig),
        ]
      }
    }
  })
}

const generateHttpClients = (httpClients: HttpClientProfile[], maps: TagMaps) => {
  return httpClients.flatMap((hc): CoreHttpClientConfig[] => {
    const { enable, tag, config, fields } = hc
    if (!enable) return []
    return [
      filterInvalidProps({
        ...(JSON.parse(fields) as CoreHttpClientConfig),
        ...generateDialer(config.dialer, maps),
        tag,
      }),
    ]
  })
}

const generateInbounds = (inbounds: InboundProfile[], maps: TagMaps) => {
  return inbounds.flatMap((inbound): CoreInboundConfig[] => {
    const { enable, type, tag, config, fields } = inbound
    if (!enable) return []

    switch (type) {
      case Inbound.Tun: {
        return [
          filterInvalidProps({
            ...(JSON.parse(fields) as CoreInboundOf<typeof Inbound.Tun>),
            ...config,
            type,
            tag,
            route_address_set: config.route_address_set.map((v) => maps.ruleSets.get(v)!),
            route_exclude_address_set: config.route_exclude_address_set.map(
              (v) => maps.ruleSets.get(v)!,
            ),
          }),
        ]
      }
      case Inbound.Tproxy:
      case Inbound.Direct: {
        return [
          filterInvalidProps({
            ...(JSON.parse(fields) as CoreInboundOf<typeof Inbound.Direct>),
            ...generateListen(config.listen, maps),
            type,
            tag,
            network: config.network,
          }),
        ]
      }
      case Inbound.Mixed:
      case Inbound.Socks:
      case Inbound.Http: {
        return [
          filterInvalidProps({
            ...(JSON.parse(fields) as CoreInboundOf<typeof Inbound.Mixed>),
            ...generateListen(config.listen, maps),
            type,
            tag,
            users: Object.entries(config.users).flatMap(([username, password]) => {
              return username && password ? [{ username, password }] : []
            }),
          }),
        ]
      }
      default:
        return [
          filterInvalidProps({
            ...JSON.parse(fields),
            ...generateListen(config.listen, maps),
            type,
            tag,
          } as CoreInboundConfig),
        ]
    }
  })
}

const generateOutbounds = async (
  outbounds: OutboundProfile[],
  maps: TagMaps,
): Promise<CoreOutboundConfig[]> => {
  const subscribesStore = useSubscribesStore()

  const SubscriptionCache = new Map<string, Promise<CoreOutboundConfig[]>>()
  const proxiesSet = new Set<CoreOutboundConfig>()

  const getProxies = (subId: string): Promise<CoreOutboundConfig[]> => {
    const cache = SubscriptionCache.get(subId)
    if (cache) return cache
    const handler = (async () => {
      const sub = subscribesStore.getSubscribeById(subId)
      if (sub) {
        try {
          return JSON.parse(await ReadFile(sub.path)) as CoreOutboundConfig[]
        } catch {
          return []
        }
      }
      return []
    })()
    return SubscriptionCache.set(subId, handler).get(subId)!
  }

  const resolveProxyTags = async (group: OutboundGroupProfile): Promise<string[]> => {
    const { outbounds: proxyRefs, include, exclude } = group

    const tags: string[] = []
    const isTagMatching = createTextMatcher(include, exclude)

    for (const proxyRef of proxyRefs) {
      switch (proxyRef.type) {
        case OutboundMember.BuiltIn:
        case OutboundMember.Endpoint: {
          tags.push(proxyRef.tag)
          break
        }

        case OutboundMember.Subscription: {
          const cachedProxies = await getProxies(proxyRef.id)
          for (const node of cachedProxies) {
            if (isTagMatching(node.tag)) {
              tags.push(node.tag)
              proxiesSet.add(node)
            }
          }
          break
        }
        case OutboundMember.Proxy: {
          const cachedProxies = await getProxies(proxyRef.subId)
          const targetProxy = cachedProxies.find((v) => v.tag === proxyRef.tag)
          if (targetProxy && isTagMatching(targetProxy.tag)) {
            tags.push(targetProxy.tag)
            proxiesSet.add(targetProxy)
          }
          break
        }
      }
    }
    return tags
  }

  const generatedOutbounds = await Promise.all(
    outbounds.map(async (outbound): Promise<CoreOutboundConfig> => {
      const { type, tag, config } = outbound

      switch (type) {
        case Outbound.Urltest:
        case Outbound.Selector: {
          const resolvedTags = await resolveProxyTags(outbound)

          return filterInvalidProps({
            ...config,
            type,
            tag,
            interval: type !== Outbound.Selector ? (config.interval as any) : undefined,
            outbounds: resolvedTags,
          })
        }

        case Outbound.Direct: {
          return filterInvalidProps({
            ...generateDialer(config.dialer, maps),
            type,
            tag,
          })
        }

        default: {
          return filterInvalidProps({
            ...config,
            type,
            tag,
          })
        }
      }
    }),
  )

  generatedOutbounds.push(...proxiesSet)

  return generatedOutbounds
}

const generateRuleSets = (ruleSets: RuleSetProfile[], maps: TagMaps): CoreRuleSetConfig[] => {
  const { env } = useEnvStore()
  const rulesetsStore = useRulesetsStore()

  return ruleSets.map((ruleset): CoreRuleSetConfig => {
    const { type, tag, config } = ruleset

    switch (type) {
      case RuleSetType.Inline:
        return {
          type,
          tag,
          rules: JSON.parse(config.rules),
        }
      case RuleSetType.Local: {
        const localRuleset = rulesetsStore.getRulesetById(config.path)
        return {
          ...config,
          type,
          tag,
          path: localRuleset?.path.replace(/^data\//, `${env.appDataPath}/`) ?? '',
        }
      }
      default: {
        return filterInvalidProps({
          ...config,
          type,
          tag,
          http_client: maps.httpClients.get(config.http_client),
        } as CoreRuleSetOf<typeof RuleSetType.Remote>)
      }
    }
  })
}

export const generateRuleConditions = (
  rule: DnsRuleProfile,
  maps: TagMaps,
): CoreDnsDefaultRule | CoreDnsLogicalRule => {
  const mergeValue = <T>(value: T[], original: T[] | undefined): T[] => {
    original ??= []
    return [...new Set([...original, ...value])]
  }

  const flattenRuleItems = (items: DnsRuleItem[]): CoreDnsDefaultRule => {
    const result: NormalizeListableProps<Pick<CoreDnsDefaultRule, DnsRuleType>> = {}

    for (const item of items) {
      const { type, value } = item
      switch (type) {
        case DnsRuleType.Inbound: {
          result[type] = mergeValue(
            value.map((v) => maps.inbounds.get(v)!),
            result[type],
          )
          break
        }

        case DnsRuleType.RuleSet: {
          result[type] = mergeValue(
            value.map((v) => maps.ruleSets.get(v)!),
            result[type],
          )
          break
        }

        case DnsRuleType.InterfaceAddress:
        case DnsRuleType.NetworkInterfaceAddress: {
          Object.entries(value).forEach(([key, v]) => {
            const orig = (result[type] ?? {}) as Recordable<string[]>
            orig[key] = mergeValue(v.split(','), orig[key])
          })
          break
        }

        case CommonRuleType.UserId:
        case DnsRuleType.SourcePort:
        case DnsRuleType.Port: {
          result[type] = mergeValue(value.map(Number), result[type])
          break
        }

        case CommonRuleType.IpVersion: {
          result[type] = Number(value) as any
          break
        }

        default:
          if (Array.isArray(value)) {
            result[type] = mergeValue(value, result[type] as any[]) as any
          } else {
            result[type] = value as any
          }
      }
    }

    return result
  }

  const { type, ruleConditions } = rule

  switch (type) {
    case RuleType.Inline: {
      return JSON.parse(ruleConditions)
    }

    case RuleType.Logical: {
      const { mode, rules } = ruleConditions

      return {
        type: 'logical',
        mode,
        rules: rules.map((subRule) => flattenRuleItems(subRule.conditions)),
      }
    }

    default: {
      return flattenRuleItems(ruleConditions)
    }
  }
}

export const generateRouteRules = (
  rules: RouteRuleProfile[],
  maps: TagMaps,
): CoreRouteRuleConfig[] => {
  return rules.flatMap((rule): CoreRouteRuleConfig[] => {
    const { enable, action, actionParams } = rule
    if (!enable) return []

    const ruleConditions = filterInvalidProps(
      generateRuleConditions(rule as any, maps) as CoreRouteDefaultRule,
    )

    switch (action) {
      case RouteRuleAction.Route:
      case RouteRuleAction.Bypass: {
        return [
          filterInvalidProps({
            ...ruleConditions,
            ...actionParams.options,
            action,
            outbound: maps.outbounds.get(actionParams.outbound),
          } as CoreRouteRuleConfig),
        ]
      }

      case RouteRuleAction.Resolve: {
        return [
          filterInvalidProps({
            ...ruleConditions,
            ...generateDomainResolver(actionParams, maps),
            action,
          }),
        ]
      }

      default: {
        return [
          filterInvalidProps({
            ...ruleConditions,
            ...actionParams,
            action,
          } as CoreRouteRuleConfig),
        ]
      }
    }
  })
}

const generateRoute = (route: RouteProfile, maps: TagMaps): CoreRouteConfig => {
  const { fields, ...rest } = route
  return filterInvalidProps({
    ...JSON.parse(fields),
    ...rest,
    default_http_client: maps.httpClients.get(route.default_http_client),
    final: maps.outbounds.get(route.final),
    default_domain_resolver: generateDomainResolver(route.default_domain_resolver, maps),

    rule_set: generateRuleSets(route.rule_set, maps),
    rules: generateRouteRules(route.rules, maps),
  })
}

const generateDnsServers = (
  dnsServes: DnsServerProfile[],
  maps: TagMaps,
): CoreDnsServerConfig[] => {
  return dnsServes.flatMap((server): CoreDnsServerConfig[] => {
    const { type, tag, config, fields } = server

    switch (type) {
      case DnsServer.Local: {
        const { prefer_go, neighbor_domain, dialer } = config
        return [
          filterInvalidProps({
            ...generateDialer(dialer, maps),
            prefer_go,
            neighbor_domain,
            type,
            tag,
          }),
        ]
      }

      case DnsServer.Hosts: {
        return [
          filterInvalidProps({
            ...config,
            type,
            tag,
            predefined: Object.entries(config.predefined).reduce<Recordable<string[]>>(
              (p, [k, v]) => {
                p[k] = v.split(',')
                return p
              },
              {},
            ),
          }),
        ]
      }

      case DnsServer.Tcp:
      case DnsServer.Udp:
      case DnsServer.Tls:
      case DnsServer.Quic:
      case DnsServer.Https:
      case DnsServer.H3: {
        const { server, server_port, dialer } = config
        const base = {
          ...(JSON.parse(fields) as CoreDnsServerOf<typeof DnsServer.Udp>),
          ...generateDialer(dialer, maps),
          server,
          server_port,
        }
        if (type === DnsServer.Https || type === DnsServer.H3) {
          return [
            filterInvalidProps({
              ...base,
              type,
              tag,
              path: config.path,
            }),
          ]
        } else {
          return [
            filterInvalidProps({
              ...base,
              type,
              tag,
            }),
          ]
        }
      }

      case DnsServer.Dhcp: {
        return [
          filterInvalidProps({
            ...config,
            ...generateDialer(config.dialer, maps),
            type,
            tag,
          }),
        ]
      }

      case DnsServer.FakeIp: {
        return [
          filterInvalidProps({
            ...config,
            type,
            tag,
          }),
        ]
      }

      default: {
        return [
          filterInvalidProps({
            ...JSON.parse(fields),
            ...(type === DnsServer.Mdns ? generateDialer(config.dialer, maps) : config),
            type,
            tag,
          } as CoreDnsServerConfig),
        ]
      }
    }
  })
}

export const generateDnsRules = (rules: DnsRuleProfile[], maps: TagMaps): CoreDnsRuleConfig[] => {
  return rules.flatMap((rule): CoreDnsRuleConfig[] => {
    const { enable, action, actionParams } = rule
    if (!enable) return []

    const ruleConditions = filterInvalidProps(generateRuleConditions(rule, maps))

    switch (action) {
      case DnsRuleAction.Route:
      case DnsRuleAction.Evaluate: {
        return [
          filterInvalidProps({
            ...ruleConditions,
            ...generateDomainResolver(actionParams, maps),
            action,
          }),
        ]
      }

      default: {
        return [
          filterInvalidProps({
            ...ruleConditions,
            ...actionParams,
            action,
          } as CoreDnsRuleConfig),
        ]
      }
    }
  })
}

const generateDns = (dns: DnsProfile, maps: TagMaps): CoreDnsConfig => {
  const { fields, ...rest } = dns
  return filterInvalidProps({
    ...JSON.parse(fields),
    ...rest,
    final: maps.dnsServers.get(dns.final),

    servers: generateDnsServers(dns.servers, maps),
    rules: generateDnsRules(dns.rules, maps),
  })
}

export const generateDnsServerUrl = (server: DnsServerProfile): string => {
  const { type, config } = server

  const host = (c: StandardDnsServerConfig) => `${c.server}${c.server_port || ''}`

  switch (type) {
    case DnsServer.Tcp:
    case DnsServer.Udp:
    case DnsServer.Tls:
    case DnsServer.Quic:
    case DnsServer.Https:
    case DnsServer.H3: {
      return `${type}://${host(config)}${type === DnsServer.Https || type === DnsServer.H3 ? config.path : ''}`
    }

    case DnsServer.Dhcp: {
      return `${type}://${config.interface}`
    }

    case DnsServer.FakeIp: {
      const ranges = [config.inet4_range, config.inet6_range].filter(Boolean).join(',')
      return `fake-ip://${ranges}`
    }

    default: {
      return type
    }
  }
}

const _adaptToStableBranch = (_: Recordable) => {}

type GenerateConfigOptions = {
  enableStableConfigCompat?: boolean
  enablePluginProcessing?: boolean
  enableMixinProcessing?: boolean
  enableScriptProcessing?: boolean
}

export const generateConfig = async (
  originalProfile: Profile,
  options: GenerateConfigOptions = {},
) => {
  if (typeof options === 'boolean') {
    options = { enableStableConfigCompat: options }
  }
  const appSettings = useAppSettingsStore()
  const isMainBranch = appSettings.app.kernel.branch === Branch.Main

  const {
    enableStableConfigCompat = isMainBranch,
    enablePluginProcessing = true,
    enableMixinProcessing = true,
    enableScriptProcessing = true,
  } = options

  const profile = deepClone(originalProfile)

  const tagMaps: TagMaps = {
    httpClients: buildIdTagMapping(profile.http_clients),
    inbounds: buildIdTagMapping([...profile.endpoints, ...profile.inbounds]),
    outbounds: buildIdTagMapping([...profile.endpoints, ...profile.outbounds]),
    ruleSets: buildRuleSetMapping(profile.route.rule_set),
    dnsServers: buildIdTagMapping(profile.dns.servers),
  }

  // step 1
  let config = filterInvalidProps({
    log: filterInvalidProps(profile.log),
    ntp: generateNtp(profile.ntp, tagMaps),
    experimental: generateExperimental(profile.experimental, tagMaps),
    endpoints: generateEndpoints(profile.endpoints, tagMaps) as any,
    services: generateServices(profile.services, tagMaps) as any,
    http_clients: generateHttpClients(profile.http_clients, tagMaps) as any,
    inbounds: generateInbounds(profile.inbounds, tagMaps) as any,
    outbounds: (await generateOutbounds(profile.outbounds, tagMaps)) as any,
    route: generateRoute(profile.route, tagMaps),
    dns: generateDns(profile.dns, tagMaps),
  } satisfies CoreConfig)

  // adapt to stable branch
  if (enableStableConfigCompat) {
    _adaptToStableBranch(config)
  }

  // step 2
  if (enablePluginProcessing) {
    const pluginsStore = usePluginsStore()
    config = (await pluginsStore.onGenerateTrigger(config, originalProfile)) as any
  }

  // step 3
  if (enableMixinProcessing) {
    const { priority, config: mixin } = originalProfile.mixin
    if (priority === 'mixin') {
      deepAssign(config, parse(mixin))
    } else if (priority === 'gui') {
      deepAssign(config, deepAssign(parse(mixin), config))
    }
  }

  // step 4
  if (enableScriptProcessing) {
    const fn = new window.AsyncFunction(
      'config',
      `${originalProfile.script.code}; return await onGenerate(config)`,
    )
    try {
      config = await fn(config)
    } catch (error: any) {
      throw error.message || error
    }

    if (typeof config !== 'object') {
      throw 'Wrong result'
    }
  }

  return config
}

export const generateConfigFile = async (
  profile: Profile,
  beforeWrite: (config: any) => Promise<any>,
) => {
  const header = `DO NOT EDIT - Auto Generated by ${APP_TITLE}`

  const _config = await generateConfig(profile)
  const config = await beforeWrite(_config)

  await WriteFile(CoreConfigFilePath, JSON.stringify({ $schema: header, ...config }, null, 2))
}
