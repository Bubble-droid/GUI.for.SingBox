import {
  ClashMode,
  LogLevel,
  Inbound,
  Outbound,
  RouteRuleType,
  TunStack,
  Network,
  RuleSetType,
  RuleSetFormat,
  DomainStrategy,
  RouteRuleAction,
  RouteRejectMethod,
  DnsServer,
  SniffProtocol,
  DnsRejectMethod,
  DnsRuleAction,
  DnsRuleType,
} from './kernel'

export const PredefinedClashModeOptions = [
  {
    label: 'kernel.global',
    value: ClashMode.Global,
    desc: 'kernel.globalDesc',
  },
  {
    label: 'kernel.rule',
    value: ClashMode.Rule,
    desc: 'kernel.ruleDesc',
  },
  {
    label: 'kernel.direct',
    value: ClashMode.Direct,
    desc: 'kernel.directDesc',
  },
]

export const LogLevelOptions = [
  {
    label: 'kernel.log.trace',
    value: LogLevel.Trace,
  },
  {
    label: 'kernel.log.debug',
    value: LogLevel.Debug,
  },
  {
    label: 'kernel.log.info',
    value: LogLevel.Info,
  },
  {
    label: 'kernel.log.warn',
    value: LogLevel.Warn,
  },
  {
    label: 'kernel.log.error',
    value: LogLevel.Error,
  },
  {
    label: 'kernel.log.fatal',
    value: LogLevel.Fatal,
  },
  {
    label: 'kernel.log.panic',
    value: LogLevel.Panic,
  },
]

export const InboundOptions = [
  { label: 'direct', value: Inbound.Direct },
  { label: 'mixed', value: Inbound.Mixed },
  { label: 'socks', value: Inbound.Socks },
  { label: 'http', value: Inbound.Http },
  { label: 'tun', value: Inbound.Tun },
]

export const OutboundOptions = [
  { label: 'kernel.outbounds.direct', value: Outbound.Direct },
  { label: 'kernel.outbounds.block', value: Outbound.Block },
  { label: 'kernel.outbounds.selector', value: Outbound.Selector },
  { label: 'kernel.outbounds.urltest', value: Outbound.UrlTest },
]

export const RouteRuleTypeOptions = [
  {
    label: 'kernel.rules.type.inbound',
    value: RouteRuleType.Inbound,
  },
  {
    label: 'kernel.rules.type.network',
    value: RouteRuleType.Network,
  },
  {
    label: 'kernel.rules.type.protocol',
    value: RouteRuleType.Protocol,
  },
  {
    label: 'kernel.rules.type.domain',
    value: RouteRuleType.Domain,
  },
  {
    label: 'kernel.rules.type.domain_suffix',
    value: RouteRuleType.DomainSuffix,
  },
  {
    label: 'kernel.rules.type.domain_keyword',
    value: RouteRuleType.DomainKeyword,
  },
  {
    label: 'kernel.rules.type.domain_regex',
    value: RouteRuleType.DomainRegex,
  },
  {
    label: 'kernel.rules.type.source_ip_cidr',
    value: RouteRuleType.SourceIPCidr,
  },
  {
    label: 'kernel.rules.type.ip_cidr',
    value: RouteRuleType.IpCidr,
  },
  {
    label: 'kernel.rules.type.ip_is_private',
    value: RouteRuleType.IpIsPrivate,
  },
  {
    label: 'kernel.rules.type.source_port',
    value: RouteRuleType.SourcePort,
  },
  {
    label: 'kernel.rules.type.source_port_range',
    value: RouteRuleType.SourcePortRange,
  },
  {
    label: 'kernel.rules.type.port',
    value: RouteRuleType.Port,
  },
  {
    label: 'kernel.rules.type.port_range',
    value: RouteRuleType.PortRange,
  },
  {
    label: 'kernel.rules.type.process_name',
    value: RouteRuleType.ProcessName,
  },
  {
    label: 'kernel.rules.type.process_path',
    value: RouteRuleType.ProcessPath,
  },
  {
    label: 'kernel.rules.type.process_path_regex',
    value: RouteRuleType.ProcessPathRegex,
  },
  {
    label: 'kernel.rules.type.clash_mode',
    value: RouteRuleType.ClashMode,
  },
  {
    label: 'kernel.rules.type.rule_set',
    value: RouteRuleType.RuleSet,
  },
  {
    label: 'kernel.rules.type.inline',
    value: RouteRuleType.Inline,
  },
]

export const DnsRuleTypeOptions = RouteRuleTypeOptions.concat([
  {
    label: 'kernel.rules.type.ip_accept_any',
    value: DnsRuleType.IpAcceptAny as any,
  },
])

export const TunStackOptions = [
  { label: 'kernel.inbounds.tun.system', value: TunStack.System },
  { label: 'kernel.inbounds.tun.gvisor', value: TunStack.GVisor },
  { label: 'kernel.inbounds.tun.mixed', value: TunStack.Mixed },
]

export const NetworkOptions = [
  { label: 'TCP', value: Network.Tcp },
  { label: 'UDP', value: Network.Udp },
]

export const RuleSetTypeOptions = [
  { label: 'kernel.route.rule_set.type.inline', value: RuleSetType.Inline },
  { label: 'kernel.route.rule_set.type.local', value: RuleSetType.Local },
  { label: 'kernel.route.rule_set.type.remote', value: RuleSetType.Remote },
]

export const RuleSetFormatOptions = [
  { label: 'ruleset.format.source', value: RuleSetFormat.Source },
  { label: 'ruleset.format.binary', value: RuleSetFormat.Binary },
]

export const DomainStrategyOptions = [
  { label: 'kernel.strategy.default', value: DomainStrategy.Default },
  { label: 'kernel.strategy.prefer_ipv4', value: DomainStrategy.PreferIpv4 },
  { label: 'kernel.strategy.prefer_ipv6', value: DomainStrategy.PreferIpv6 },
  { label: 'kernel.strategy.ipv4_only', value: DomainStrategy.Ipv4Only },
  { label: 'kernel.strategy.ipv6_only', value: DomainStrategy.Ipv6Only },
]

export const RouteRuleActionOptions = [
  { label: 'kernel.route.rules.action.route', value: RouteRuleAction.Route },
  { label: 'kernel.route.rules.action.route-options', value: RouteRuleAction.RouteOptions },
  { label: 'kernel.route.rules.action.reject', value: RouteRuleAction.Reject },
  { label: 'kernel.route.rules.action.hijack-dns', value: RouteRuleAction.HijackDns },
  { label: 'kernel.route.rules.action.sniff', value: RouteRuleAction.Sniff },
  { label: 'kernel.route.rules.action.resolve', value: RouteRuleAction.Resolve },
]

export const RouteRejectMethodOptions = [
  { label: 'kernel.route.rules.action.rejectDefault', value: RouteRejectMethod.Default },
  { label: 'kernel.route.rules.action.rejectDrop', value: RouteRejectMethod.Drop },
  { label: 'kernel.route.rules.action.rejectReply', value: RouteRejectMethod.Reply },
]

export const DnsServerTypeOptions = [
  { label: 'kernel.dns.type.local', value: DnsServer.Local },
  { label: 'kernel.dns.type.hosts', value: DnsServer.Hosts },
  { label: 'kernel.dns.type.tcp', value: DnsServer.Tcp },
  { label: 'kernel.dns.type.udp', value: DnsServer.Udp },
  { label: 'kernel.dns.type.tls', value: DnsServer.Tls },
  { label: 'kernel.dns.type.quic', value: DnsServer.Quic },
  { label: 'kernel.dns.type.https', value: DnsServer.Https },
  { label: 'kernel.dns.type.h3', value: DnsServer.H3 },
  { label: 'kernel.dns.type.dhcp', value: DnsServer.Dhcp },
  { label: 'kernel.dns.type.fakeip', value: DnsServer.FakeIp },
]

export const DnsRuleActionOptions = [
  { label: 'kernel.route.rules.action.route', value: DnsRuleAction.Route },
  { label: 'kernel.route.rules.action.route-options', value: DnsRuleAction.RouteOptions },
  { label: 'kernel.route.rules.action.reject', value: DnsRuleAction.Reject },
  { label: 'kernel.route.rules.action.predefined', value: DnsRuleAction.Predefined },
]

export const DnsRejectMethodOptions = [
  { label: 'kernel.route.rules.action.rejectDefault', value: DnsRejectMethod.Default },
  { label: 'kernel.route.rules.action.rejectDrop', value: DnsRejectMethod.Drop },
]

export const SniffProtocolOptions = [
  { label: 'kernel.route.rules.sniffer.http', value: SniffProtocol.Http },
  { label: 'kernel.route.rules.sniffer.tls', value: SniffProtocol.Tls },
  { label: 'kernel.route.rules.sniffer.quic', value: SniffProtocol.Quic },
  { label: 'kernel.route.rules.sniffer.stun', value: SniffProtocol.Stun },
  { label: 'kernel.route.rules.sniffer.dns', value: SniffProtocol.Dns },
  { label: 'kernel.route.rules.sniffer.bittorrent', value: SniffProtocol.Bittorrent },
  { label: 'kernel.route.rules.sniffer.dtls', value: SniffProtocol.Dtls },
  { label: 'kernel.route.rules.sniffer.ssh', value: SniffProtocol.Ssh },
  { label: 'kernel.route.rules.sniffer.rdp', value: SniffProtocol.Rdp },
  { label: 'kernel.route.rules.sniffer.ntp', value: SniffProtocol.Ntp },
]
