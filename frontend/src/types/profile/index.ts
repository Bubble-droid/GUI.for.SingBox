import type {
  Network,
  OutboundMember,
  Outbound,
  RuleSetType,
  RouteRuleAction,
  DomainStrategy,
  DnsRuleAction,
  DnsServer,
  RuleType,
  Endpoint,
  QuicClient,
  LogLevel,
  RuleSetFormat,
  LogicalRuleMode,
  DnsRcode,
  DnsRejectMethod,
  DnsRuleType,
  RouteRejectMethod,
  RouteRuleType,
  SniffProtocol,
} from '@/enums'
import type {
  CommonRuleItem,
  Dialer,
  DnsRouteOptions,
  DnsServerId,
  DomainResolver,
  ExpandByProperty,
  HttpClientId,
  InboundProfile,
  Listen,
  OutboundId,
  Prettify,
  ProfileBase,
  ProxyId,
  Recordable,
  RouteOptions,
  RuleBaseProfile,
  RuleSetId,
  SubscriptionId,
  SwitchableProfile,
  TagItem,
} from '@/types'

import type { ServiceProfile } from './service'

export type * from './inbound'
export type * from './shared'
export type * from './service'

export interface LogProfile {
  disabled: boolean
  level: LogLevel
  output: string
  timestamp: boolean
}

export interface NtpProfile {
  enabled: boolean
  server: string
  server_port: number
  interval: string
  dialer: Dialer
}

export interface ExperimentalProfile {
  clash_api: {
    external_controller: string
    external_ui: string
    external_ui_download_url: string
    external_ui_download_detour: OutboundId
    secret: string
    default_mode: string
    access_control_allow_private_network: boolean
    access_control_allow_origin: string[]
  }
  cache_file: {
    enabled: boolean
    path: string
    cache_id: string
    store_fakeip: boolean
    store_dns: boolean
  }
}

interface ServerEndpointProfile extends SwitchableProfile {
  type: typeof Endpoint.OpenvpnServer
  config: {
    listen: Listen
  }
}

interface StandardEndpointProfile extends SwitchableProfile {
  type: Exclude<Endpoint, typeof Endpoint.OpenvpnServer>
  config: {
    dialer: Dialer
  }
}

export type EndpointProfile = StandardEndpointProfile | ServerEndpointProfile

export interface HttpClientProfile extends SwitchableProfile {
  config: {
    dialer: Dialer
  }
}

interface StandardOutboundMember {
  id: string
  type:
    | typeof OutboundMember.BuiltIn
    | typeof OutboundMember.Endpoint
    | typeof OutboundMember.Subscription
  tag: string
}

interface ProxyOutboundMember {
  id: ProxyId
  subId: SubscriptionId
  type: typeof OutboundMember.Proxy
  tag: string
}

export type OutboundMemberProfile =
  | ExpandByProperty<StandardOutboundMember, 'type'>
  | ProxyOutboundMember

export interface OutboundDirectProfile extends ProfileBase {
  type: typeof Outbound.Direct
  config: {
    dialer: Dialer
  }
}

export interface OutboundBridgeProfile extends ProfileBase {
  type: typeof Outbound.Bridge
  config: {
    interface: string
    bridge_name: string
  }
}

export interface OutboundBlockProfile extends ProfileBase {
  type: typeof Outbound.Block
  config: {}
}

export interface OutboundGroupProfile {
  outbounds: OutboundMemberProfile[]
  include: string
  exclude: string
  icon: string
  hidden: boolean
}

export interface OutboundUrlTestProfile extends ProfileBase, OutboundGroupProfile {
  type: typeof Outbound.Urltest
  config: {
    url: string
    interval: string
    tolerance: number
    interrupt_exist_connections: boolean
  }
}

export interface OutboundSelectorProfile extends ProfileBase, OutboundGroupProfile {
  type: typeof Outbound.Selector
  config: {
    interrupt_exist_connections: boolean
  }
}

export type OutboundProfile =
  | OutboundDirectProfile
  | OutboundBridgeProfile
  | OutboundBlockProfile
  | OutboundUrlTestProfile
  | OutboundSelectorProfile

//  RuleSets Profiles
export interface RuleSetInlineProfile extends TagItem {
  type: typeof RuleSetType.Inline
  config: {
    rules: string
  }
}

export interface RuleSetLocalProfile extends TagItem {
  type: typeof RuleSetType.Local
  config: {
    path: RuleSetId
    format: RuleSetFormat
  }
}

export interface RuleSetRemoteProfile extends Pick<TagItem, 'id'> {
  tag: string[]
  type: typeof RuleSetType.Remote
  config: {
    url: string
    http_client: HttpClientId
    update_interval: string
    format: RuleSetFormat
  }
}

export type RuleSetProfile = RuleSetInlineProfile | RuleSetLocalProfile | RuleSetRemoteProfile

// RouteRule Profiles
export type RouteRuleItem =
  | CommonRuleItem
  | {
      type: typeof RouteRuleType.Network
      value: Network[]
    }
  | {
      type: typeof RouteRuleType.Client
      value: QuicClient[]
    }
  | {
      type: typeof RouteRuleType.PreferredBy
      value: (Endpoint | typeof Outbound.Bridge)[]
    }

export interface RouteRuleDefaultProfile extends RuleBaseProfile {
  type: typeof RuleType.Default
  ruleConditions: RouteRuleItem[]
}

export interface RouteRuleLogicalProfile extends RuleBaseProfile {
  type: typeof RuleType.Logical
  ruleConditions: {
    mode: LogicalRuleMode
    rules: {
      conditions: RouteRuleItem[]
    }[]
  }
}

export interface RouteRuleInlineProfile extends RuleBaseProfile {
  type: typeof RuleType.Inline
  ruleConditions: string
}

export type RouteRuleConditionUnion =
  | RouteRuleDefaultProfile
  | RouteRuleLogicalProfile
  | RouteRuleInlineProfile

type RouteActionParams =
  | {
      action: typeof RouteRuleAction.Route
      actionParams: {
        outbound: OutboundId
        options: RouteOptions
      }
    }
  | {
      action: typeof RouteRuleAction.Bypass
      actionParams: {
        outbound: OutboundId
        options: RouteOptions
      }
    }
  | {
      action: typeof RouteRuleAction.HijackDns
      actionParams: {}
    }
  | {
      action: typeof RouteRuleAction.RouteOptions
      actionParams: RouteOptions
    }
  | {
      action: typeof RouteRuleAction.Sniff
      actionParams: {
        sniffer: SniffProtocol[]
      }
    }
  | {
      action: typeof RouteRuleAction.Reject
      actionParams: {
        method: RouteRejectMethod
        no_drop: boolean
      }
    }
  | {
      action: typeof RouteRuleAction.Resolve
      actionParams: DomainResolver
    }

export type RouteRuleProfile = Prettify<RouteRuleConditionUnion & RouteActionParams>

export type RouteProfile = {
  rules: RouteRuleProfile[]
  rule_set: RuleSetProfile[]
  default_http_client: HttpClientId
  final: OutboundId
  find_process: boolean
  auto_detect_interface: boolean
  default_interface: string
  default_domain_resolver: DomainResolver
  fields: string
}

// DnsRule Profiles

export type DnsRuleItem =
  | CommonRuleItem
  | {
      type: typeof DnsRuleType.QueryType
      value: string[]
    }
  | {
      type: typeof DnsRuleType.Network
      value: Exclude<Network, typeof Network.Icmp>[]
    }
  | {
      type: typeof DnsRuleType.IpAcceptAny
      value: boolean
    }
  | {
      type: typeof DnsRuleType.MatchResponse
      value: boolean
    }
  | {
      type: typeof DnsRuleType.ResponseRcode
      value: DnsRcode
    }
  | {
      type: typeof DnsRuleType.PreferredBy
      value: Extract<
        DnsServer,
        | typeof DnsServer.Hosts
        | typeof DnsServer.Local
        | typeof DnsServer.Mdns
        | typeof DnsServer.Tailscale
        | typeof DnsServer.Resolved
      >[]
    }

export interface DnsRuleDefaultProfile extends RuleBaseProfile {
  type: typeof RuleType.Default
  ruleConditions: DnsRuleItem[]
}

export interface DnsRuleLogicalProfile extends RuleBaseProfile {
  type: typeof RuleType.Logical
  ruleConditions: {
    mode: LogicalRuleMode
    rules: {
      conditions: DnsRuleItem[]
    }[]
  }
}

export interface DnsRuleInlineProfile extends RuleBaseProfile {
  type: typeof RuleType.Inline
  ruleConditions: string
}

export type DnsRuleConditionUnion =
  | DnsRuleDefaultProfile
  | DnsRuleLogicalProfile
  | DnsRuleInlineProfile

type DnsActionParamsUnion =
  | {
      action: typeof DnsRuleAction.Route
      actionParams: DomainResolver
    }
  | {
      action: typeof DnsRuleAction.Evaluate
      actionParams: DomainResolver
    }
  | {
      action: typeof DnsRuleAction.Respond
      actionParams: {}
    }
  | {
      action: typeof DnsRuleAction.RouteOptions
      actionParams: DnsRouteOptions
    }
  | {
      action: typeof DnsRuleAction.Reject
      actionParams: {
        method: DnsRejectMethod
        no_drop: boolean
      }
    }
  | {
      action: typeof DnsRuleAction.Predefined
      actionParams: {
        rcode: DnsRcode
        answer: string[]
      }
    }

export type DnsRuleProfile = Prettify<DnsRuleConditionUnion & DnsActionParamsUnion>

// DnsServer Profiles
export interface DnsServerLocalProfile extends ProfileBase {
  type: typeof DnsServer.Local
  config: {
    prefer_go: boolean
    neighbor_domain: string[]
    dialer: Dialer
  }
}

export interface DnsServerHostsProfile extends ProfileBase {
  type: typeof DnsServer.Hosts
  config: {
    path: string[]
    predefined: Recordable<string>
  }
}

export interface StandardDnsServerConfig {
  server: string
  server_port: number
}

type StandardDnsServerType =
  | typeof DnsServer.Tcp
  | typeof DnsServer.Udp
  | typeof DnsServer.Tls
  | typeof DnsServer.Quic

export interface DnsServerStandardProfile extends ProfileBase {
  type: StandardDnsServerType
  config: StandardDnsServerConfig & {
    dialer: Dialer
  }
}

type HttpDnsServerType = typeof DnsServer.Https | typeof DnsServer.H3

export interface DnsServerHttpProfile extends ProfileBase {
  type: HttpDnsServerType
  config: StandardDnsServerConfig & {
    path: string
    dialer: Dialer
  }
}

export interface DnsServerDhcpProfile extends ProfileBase {
  type: typeof DnsServer.Dhcp
  config: {
    interface: string
    dialer: Dialer
  }
}

export interface DnsServerFakeIpProfile extends ProfileBase {
  type: typeof DnsServer.FakeIp
  config: {
    inet4_range: string
    inet6_range: string
  }
}

export interface DnsServerMdnsProfile extends ProfileBase {
  type: typeof DnsServer.Mdns
  config: {
    dialer: Dialer
  }
}

export interface DnsServerAnyProfile extends ProfileBase {
  type: typeof DnsServer.Tailscale | typeof DnsServer.Resolved
  config: {}
}

export type DnsServerProfile =
  | ExpandByProperty<DnsServerStandardProfile, 'type'>
  | ExpandByProperty<DnsServerHttpProfile, 'type'>
  | DnsServerLocalProfile
  | DnsServerDhcpProfile
  | DnsServerHostsProfile
  | DnsServerFakeIpProfile
  | DnsServerMdnsProfile
  | DnsServerAnyProfile

export type DnsProfile = {
  servers: DnsServerProfile[]
  rules: DnsRuleProfile[]
  final: DnsServerId
  optimistic: boolean
  reverse_mapping: boolean
  strategy: DomainStrategy
  disable_cache: boolean
  disable_expire: boolean
  client_subnet: string
  fields: string
}

export interface MixinProfile {
  priority: 'mixin' | 'gui'
  format: 'json' | 'yaml'
  config: string
}

export interface ScriptProfile {
  code: string
}

export interface Profile {
  id: string
  name: string
  log: LogProfile
  ntp: NtpProfile
  experimental: ExperimentalProfile
  endpoints: EndpointProfile[]
  services: ServiceProfile[]
  http_clients: HttpClientProfile[]
  inbounds: InboundProfile[]
  outbounds: OutboundProfile[]
  route: RouteProfile
  dns: DnsProfile
  mixin: MixinProfile
  script: ScriptProfile
}
