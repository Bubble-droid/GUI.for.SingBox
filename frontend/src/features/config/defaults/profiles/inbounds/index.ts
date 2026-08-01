import { TunStack, Inbound } from '@/enums'

import type { InboundConfig } from '@/features/config/types'

import { DefaultInboundIds } from '../shared'

export const createInboundSocks = (): NonNullable<InboundConfig['socks']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20120,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundHttp = (): NonNullable<InboundConfig['http']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20121,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundMixed = (): NonNullable<InboundConfig['mixed']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20122,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundDirect = (): NonNullable<InboundConfig['direct']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20119,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  network: '',
})

export const createInboundTun = (): NonNullable<InboundConfig['tun']> => ({
  interface_name: '',
  address: ['172.18.0.1/30', 'fdfe:dcba:9876::1/126'],
  mtu: 0,
  auto_route: true,
  strict_route: true,
  route_address: [],
  route_exclude_address: [],
  endpoint_independent_nat: false,
  stack: TunStack.Mixed,
})

export const createInbounds = (): InboundConfig[] => [
  {
    id: DefaultInboundIds.MixedIn,
    type: Inbound.Mixed,
    tag: 'mixed-in',
    enable: true,
    mixed: createInboundMixed(),
  },
  {
    id: DefaultInboundIds.Tun,
    type: Inbound.Tun,
    tag: 'tun-in',
    enable: false,
    tun: createInboundTun(),
  },
]
