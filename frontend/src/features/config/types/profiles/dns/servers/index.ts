import type { DnsServer } from '@/enums'
import type { TagItem } from '@/features/config/types'

export interface DnsServerConfig extends TagItem {
  type: DnsServer
  // [local,tcp,udp,tls,quic,https/h3,dhcp]
  detour: string
  domain_resolver: string
  // hosts
  hosts_path: string[]
  predefined: Recordable
  // [tcp,udp,tls,quic/https,h3]
  server: string
  server_port: string
  // [https,h3]
  path: string
  // dhcp
  interface: string
  // fakeip
  inet4_range: string
  inet6_range: string
}
