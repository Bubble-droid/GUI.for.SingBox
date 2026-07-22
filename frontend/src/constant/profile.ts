import {
  ClashMode,
  DnsRcode,
  DnsRejectMethod,
  DnsRuleAction,
  DnsServer,
  Inbound,
  LogLevel,
  LogicalRuleMode,
  Outbound,
  RouteRejectMethod,
  RouteRuleAction,
  RuleSetFormat,
  RuleSetType,
  RuleType,
  Service,
  TunDnsMode,
  TunStack,
} from '@/enums'
import { Endpoint } from '@/enums'
import { generateSecureKey, sampleID } from '@/utils'

import type { NetworkStrategy, TlsSpoofMethod, DomainStrategy } from '@/enums'
import type {
  Dialer,
  DnsProfile,
  DnsRouteOptions,
  DnsRuleProfile,
  DnsServerProfile,
  DomainResolver,
  EndpointProfile,
  ExperimentalProfile,
  HttpClientProfile,
  InboundProfile,
  Listen,
  LogProfile,
  MixinProfile,
  NtpProfile,
  OutboundGroupProfile,
  OutboundProfile,
  Profile,
  ProfileBase,
  RouteOptions,
  RouteProfile,
  RouteRuleProfile,
  RuleSetProfile,
  ScriptProfile,
  ServiceProfile,
  SwitchableProfile,
  TagItem,
} from '@/types'

const DefaultTagItem = (): TagItem => ({
  id: sampleID(),
  tag: '',
})

const DefaultProfileBase = (): ProfileBase => ({
  ...DefaultTagItem(),
  fields: '{}',
})

const DefaultSwitchable = (): SwitchableProfile => ({
  ...DefaultProfileBase(),
  enable: true,
})

export const getDefaultListen = (portOffset = 0): Listen => ({
  listen: '127.0.0.1',
  listen_port: 20119 + portOffset,
  bind_interface: '',
  routing_mark: 0,
  reuse_addr: false,
  netns: '',
  tcp_fast_open: false,
  tcp_multi_path: false,
  disable_tcp_keep_alive: false,
  tcp_keep_alive: '',
  tcp_keep_alive_interval: '',
  udp_fragment: false,
  udp_timeout: '',
  detour: '',
})

export const getDefaultDnsRouteOptions = (): DnsRouteOptions => ({
  disable_cache: false,
  disable_optimistic_cache: false,
  rewrite_ttl: 0,
  timeout: '',
  client_subnet: '',
})

export const getDefaultDomainResolver = (): DomainResolver => ({
  ...getDefaultDnsRouteOptions(),
  server: '',
  strategy: '' as DomainStrategy,
})

export const getDefaultDialer = (): Dialer => ({
  detour: '',
  bind_interface: '',
  inet4_bind_address: '',
  inet6_bind_address: '',
  bind_address_no_port: false,
  protect_path: '',
  routing_mark: 0,
  reuse_addr: false,
  netns: '',
  connect_timeout: '',
  tcp_fast_open: false,
  tcp_multi_path: false,
  disable_tcp_keep_alive: false,
  tcp_keep_alive: '',
  tcp_keep_alive_interval: '',
  udp_fragment: false,
  domain_resolver: getDefaultDomainResolver(),
  network_strategy: '' as NetworkStrategy,
  network_type: [],
  fallback_network_type: [],
  fallback_delay: '',
  network_fallback_delay: '',
})

export const getDefaultRouteOptions = (): RouteOptions => ({
  override_address: '',
  override_port: 0,
  network_strategy: '' as NetworkStrategy,
  fallback_delay: '',
  udp_disable_domain_unmapping: false,
  udp_connect: false,
  udp_timeout: '',
  tls_fragment: false,
  tls_fragment_fallback_delay: '',
  tls_record_fragment: false,
  tls_spoof: '',
  tls_spoof_method: '' as TlsSpoofMethod,
})

export const getDefaultLog = (): LogProfile => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})

export const getDefaultNtp = (): NtpProfile => ({
  enabled: false,
  server: '',
  server_port: 123,
  interval: '',
  dialer: getDefaultDialer(),
})

export const getDefaultExperimental = (): ExperimentalProfile => ({
  clash_api: {
    external_controller: '127.0.0.1:20118',
    external_ui: '',
    external_ui_download_url: '',
    external_ui_download_detour: '',
    secret: generateSecureKey(),
    default_mode: ClashMode.Rule,
    access_control_allow_origin: [],
    access_control_allow_private_network: false,
  },
  cache_file: {
    enabled: true,
    path: 'cache.db',
    cache_id: sampleID(),
    store_dns: false,
    store_fakeip: false,
  },
})

export const getDefaultEndpoint = <T extends Endpoint>(
  type: T,
): Extract<EndpointProfile, { type: T }> => {
  const base = {
    ...DefaultSwitchable(),
    type,
    tag: `${type}-ep`,
  }
  if (type === Endpoint.OpenvpnServer) {
    return {
      ...base,
      config: {
        listen: getDefaultListen(),
      },
    } as Extract<EndpointProfile, { type: T }>
  } else {
    return {
      ...base,
      config: {
        dialer: getDefaultDialer(),
      },
    } as Extract<EndpointProfile, { type: T }>
  }
}

type ServiceProfileResult<T extends Service> = Extract<ServiceProfile, { type: T }>

export const getDefaultService = <T extends Service>(type: T): ServiceProfileResult<T> => {
  const base = {
    ...DefaultSwitchable(),
    type,
    tag: `${type}-sv`,
  }

  switch (type) {
    case Service.Api: {
      return {
        ...base,
        config: {
          listen: getDefaultListen(),
          secret: '',
          access_control_allow_origin: [],
          access_control_allow_private_network: false,
          dashboard: {
            enabled: false,
            path: '',
            download_url: '',
            http_client: '',
            update_interval: '',
          },
        },
      } as unknown as ServiceProfileResult<T>
    }

    case Service.UsbipClient: {
      return {
        ...base,
        config: {
          dialer: getDefaultDialer(),
        },
      } as ServiceProfileResult<T>
    }

    default: {
      return {
        ...base,
        config: {
          listen: getDefaultListen(),
        },
      } as ServiceProfileResult<T>
    }
  }
}

export const getDefaultHttpClient = (): HttpClientProfile => ({
  ...DefaultSwitchable(),
  config: {
    dialer: getDefaultDialer(),
  },
})

type InboundProfileResult<T extends Inbound> = Extract<InboundProfile, { type: T }>

export const getDefaultInbound = <T extends Inbound>(type: T): InboundProfileResult<T> => {
  const base = {
    ...DefaultSwitchable(),
    type,
    tag: `${type}-in`,
  }

  switch (type) {
    case Inbound.Direct:
    case Inbound.Tproxy:
      return {
        ...base,
        config: {
          listen: getDefaultListen(1),
          network: '',
        },
      } as unknown as InboundProfileResult<T>

    case Inbound.Mixed:
    case Inbound.Socks:
    case Inbound.Http:
      return {
        ...base,
        config: {
          listen: getDefaultListen(3),
          users: {},
        },
      } as unknown as InboundProfileResult<T>

    case Inbound.Tun:
      return {
        ...base,
        config: {
          interface_name: '',
          address: ['172.18.0.1/30', 'fdfe:dcba:9876::1/126'],
          mtu: 0,
          dns_mode: TunDnsMode.Hijack,
          dns_address: [],
          auto_route: true,
          auto_redirect: false,
          strict_route: false,
          endpoint_independent_nat: false,
          stack: TunStack.Mixed,
          route_address: [],
          route_exclude_address: [],
          route_address_set: [],
          route_exclude_address_set: [],
          include_interface: [],
          exclude_interface: [],
        },
      } as unknown as InboundProfileResult<T>

    default:
      return {
        ...base,
        config: {
          listen: getDefaultListen(),
        },
      } as unknown as InboundProfileResult<T>
  }
}

type OutboundProfileResult<T extends Outbound> = Extract<OutboundProfile, { type: T }>

export const getDefaultOutbound = <T extends Outbound>(type: T): OutboundProfileResult<T> => {
  const base = {
    ...DefaultProfileBase(),
    type,
    tag: `${type}-out`,
  }

  const groupFields: OutboundGroupProfile = {
    outbounds: [],
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  }

  switch (type) {
    case Outbound.Direct:
      return {
        ...base,
        config: {
          dialer: getDefaultDialer(),
        },
      } as unknown as OutboundProfileResult<T>

    case Outbound.Bridge:
      return {
        ...base,
        config: {
          interface: '',
          bridge_name: '',
        },
      } as unknown as OutboundProfileResult<T>

    case Outbound.Block:
      return {
        ...base,
        config: {},
      } as unknown as OutboundProfileResult<T>

    case Outbound.Urltest:
      return {
        ...base,
        ...groupFields,
        config: {
          url: '',
          interval: '3m',
          tolerance: 50,
          interrupt_exist_connections: false,
        },
      } as unknown as OutboundProfileResult<T>

    case Outbound.Selector:
      return {
        ...base,
        ...groupFields,
        config: {
          interrupt_exist_connections: false,
        },
      } as unknown as OutboundProfileResult<T>

    default:
      return base as OutboundProfileResult<T>
  }
}

type RuleSetProfileResult<T extends RuleSetType> = Extract<RuleSetProfile, { type: T }>

export const getDefaultRuleSet = <T extends RuleSetType>(type: T): RuleSetProfileResult<T> => {
  const base = {
    ...DefaultTagItem(),
    type,
  }

  switch (type) {
    case RuleSetType.Local:
      return {
        ...base,
        config: {
          path: '',
          format: RuleSetFormat.Binary,
        },
      } as RuleSetProfileResult<T>

    case RuleSetType.Remote:
      return {
        ...base,
        tag: [],
        config: {
          url: '',
          format: RuleSetFormat.Binary,
          http_client: '',
          update_interval: '',
        },
      } as unknown as RuleSetProfileResult<T>

    case RuleSetType.Inline:
    default:
      return {
        ...base,
        config: {
          rules: '[]',
        },
      } as RuleSetProfileResult<T>
  }
}

const getDefaultRuleConditions = (type: RuleType) => {
  switch (type) {
    case RuleType.Logical:
      return {
        mode: LogicalRuleMode.And,
        rules: [],
      }
    case RuleType.Inline:
      return '{}'
    case RuleType.Default:
    default:
      return []
  }
}

const getRouteActionParams = (action: RouteRuleAction) => {
  switch (action) {
    case RouteRuleAction.Route:
    case RouteRuleAction.Bypass:
      return {
        outbound: '',
        options: getDefaultRouteOptions(),
      }
    case RouteRuleAction.RouteOptions:
      return getDefaultRouteOptions()
    case RouteRuleAction.Reject:
      return {
        method: RouteRejectMethod.Default,
        no_drop: false,
      }
    case RouteRuleAction.Sniff:
      return {
        sniffer: [],
      }
    case RouteRuleAction.Resolve:
      return getDefaultDomainResolver()
    default:
      return {}
  }
}

type RouteRuleProfileResult<T extends RuleType, A extends RouteRuleAction> = Extract<
  RouteRuleProfile,
  { type: T; action: A }
>

export const getDefaultRouteRule = <T extends RuleType, A extends RouteRuleAction>(
  type: T,
  action: A,
): RouteRuleProfileResult<T, A> => {
  return {
    id: sampleID(),
    enable: true,
    invert: false,
    fields: '{}',
    type,
    ruleConditions: getDefaultRuleConditions(type),
    action,
    actionParams: getRouteActionParams(action),
  } as unknown as RouteRuleProfileResult<T, A>
}

export const getDefaultRoute = (): RouteProfile => ({
  rules: [],
  rule_set: [],
  auto_detect_interface: true,
  default_interface: '',
  find_process: false,
  final: '',
  default_http_client: '',
  default_domain_resolver: getDefaultDomainResolver(),
  fields: '{}',
})

const getDnsActionParams = (action: DnsRuleAction) => {
  switch (action) {
    case DnsRuleAction.Route:
    case DnsRuleAction.Evaluate:
      return getDefaultDomainResolver()
    case DnsRuleAction.RouteOptions:
      return getDefaultDnsRouteOptions()
    case DnsRuleAction.Reject:
      return {
        method: DnsRejectMethod.Default,
        no_drop: false,
      }
    case DnsRuleAction.Predefined:
      return {
        rcode: DnsRcode.NOERROR,
        answer: [],
      }
    default:
      return {}
  }
}

type DnsRuleProfileResult<T extends RuleType, A extends DnsRuleAction> = Extract<
  DnsRuleProfile,
  { type: T; action: A }
>

export const getDefaultDnsRule = <T extends RuleType, A extends DnsRuleAction>(
  type: T,
  action: A,
): DnsRuleProfileResult<T, A> => {
  return {
    id: sampleID(),
    enable: true,
    invert: false,
    match_response: false,
    fields: '{}',
    type,
    ruleConditions: getDefaultRuleConditions(type),
    action,
    actionParams: getDnsActionParams(action),
  } as unknown as DnsRuleProfileResult<T, A>
}

type DnsServerProfileResult<T extends DnsServer> = Extract<DnsServerProfile, { type: T }>

export const getDefaultDnsServer = <T extends DnsServer>(type: T): DnsServerProfileResult<T> => {
  const base = {
    ...DefaultProfileBase(),
    type,
    tag: `${type}-dns`,
  }

  const standardConfig = {
    server: '',
    server_port: 0,
    dialer: getDefaultDialer(),
  }

  switch (type) {
    case DnsServer.Tcp:
    case DnsServer.Udp:
    case DnsServer.Tls:
    case DnsServer.Quic:
      return {
        ...base,
        config: standardConfig,
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.Https:
    case DnsServer.H3:
      return {
        ...base,
        config: {
          ...standardConfig,
          path: '',
        },
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.Local:
      return {
        ...base,
        config: {
          prefer_go: false,
          neighbor_domain: [],
          dialer: getDefaultDialer(),
        },
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.Dhcp:
      return {
        ...base,
        config: {
          interface: '',
          dialer: getDefaultDialer(),
        },
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.Hosts:
      return {
        ...base,
        config: {
          path: [],
          predefined: {},
        },
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.FakeIp:
      return {
        ...base,
        config: {
          inet4_range: '198.18.0.0/15',
          inet6_range: 'fc00::/18',
        },
      } as unknown as DnsServerProfileResult<T>

    case DnsServer.Mdns:
      return {
        ...base,
        config: {
          dialer: getDefaultDialer(),
        },
      } as unknown as DnsServerProfileResult<T>

    default:
      return {
        ...base,
        config: {},
      } as unknown as DnsServerProfileResult<T>
  }
}

export const getDefaultDns = (): DnsProfile => ({
  servers: [],
  rules: [],
  strategy: '' as DomainStrategy,
  optimistic: false,
  reverse_mapping: false,
  disable_cache: false,
  disable_expire: false,
  client_subnet: '',
  final: '',
  fields: '{}',
})

export const getDefaultMixin = (): MixinProfile => ({
  priority: 'mixin',
  format: 'json',
  config: '{}',
})

export const getDefaultScript = (): ScriptProfile => ({
  code: `const onGenerate = async (config) => {\n  return config\n}`,
})

export const getDefaultProfile = (name = sampleID()): Profile => ({
  id: sampleID(),
  name,
  log: getDefaultLog(),
  ntp: getDefaultNtp(),
  experimental: getDefaultExperimental(),
  endpoints: [],
  services: [],
  http_clients: [],
  inbounds: [],
  outbounds: [],
  route: getDefaultRoute(),
  dns: getDefaultDns(),
  mixin: getDefaultMixin(),
  script: getDefaultScript(),
})
