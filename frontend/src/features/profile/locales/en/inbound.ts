import type { MessageSchema } from '../types'

export default {
  enable: 'Enable',
  tag: 'Tag',
  users: 'Http/Socks users',
  listen: {
    listen: 'Listen',
    listen_port: 'Port',
    tcp_fast_open: 'TCP Fast Open',
    tcp_multi_path: 'TCP Multi Path',
    udp_fragment: 'UDP Fragmentation',
  },
  tun: {
    interface_name: 'Interface Name',
    address: 'IPv4 & IPv6 Prefix',
    mtu: 'MTU',
    auto_route: 'Auto Route',
    strict_route: 'Strict Route',
    route_address: 'Route Address',
    route_exclude_address: 'Route Exclude Address',
    endpoint_independent_nat: 'Endpoint Independent NAT',
    stack: 'Stack',
    system: 'System',
    gvisor: 'gVisor',
    mixed: 'Mixed',
  },
  direct: {
    network: 'Listen Network',
    default: 'Both if empty',
  },
  mixedPort: 'Mixed Port',
  httpPort: 'HTTP(s) Port',
  socksPort: 'SOCKS5 Port',
} satisfies MessageSchema['inbounds']
