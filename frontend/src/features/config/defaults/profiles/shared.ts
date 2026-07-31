export const DefaultOutboundIds = {
  Select: 'outbound-select',
  Urltest: 'outbound-urltest',
  Direct: 'outbound-direct',
  Block: 'outbound-block',
  Fallback: 'outbound-fallback',
  Global: 'outbound-global',
} as const

export const DefaultInboundIds = {
  MixedIn: 'mixed-in',
  Tun: 'tun-in',
} as const

export const DefaultRulesetIds = {
  CATEGORY_ADS: 'Category-Ads',
  GEOIP_CN: 'GeoIP-CN',
  GEOSITE_CN: 'GeoSite-CN',
  GEOLOCATION_NOT_CN: 'GeoLocation-!CN',
  GEOSITE_PRIVATE: 'GeoSite-Private',
  GEOIP_PRIVATE: 'GeoIP-Private',
} as const

export const DefaultDnsServersIds = {
  LocalDns: 'Local-DNS',
  RemoteDns: 'Remote-DNS',
  FakeIP: 'Fake-IP',
  LocalDnsResolver: 'Local-DNS-Resolver',
  RemoteDnsResolver: 'Remote-DNS-Resolver',
} as const
