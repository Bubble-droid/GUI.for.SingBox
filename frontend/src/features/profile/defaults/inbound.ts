import type { Network } from '@profile/constant/kernel'
import { InboundType, TunStack } from '@profile/constant/kernel'
import type { InboundItem } from '@profile/types/profiles/inbound'

import { DefaultInboundIds } from './shared'

export const createInboundSocks = (): NonNullable<InboundItem['socks']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20120,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundHttp = (): NonNullable<InboundItem['http']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20121,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundMixed = (): NonNullable<InboundItem['mixed']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20122,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  users: [],
})

export const createInboundDirect = (): NonNullable<InboundItem['direct']> => ({
  listen: {
    listen: '127.0.0.1',
    listen_port: 20119,
    tcp_fast_open: false,
    tcp_multi_path: false,
    udp_fragment: false,
  },
  network: '' as Network,
})

export const createInboundTun = (): NonNullable<InboundItem['tun']> => ({
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

export const createInbounds = (): InboundItem[] => [
  {
    id: DefaultInboundIds.MixedIn,
    type: InboundType.Mixed,
    tag: 'mixed-in',
    enable: true,
    mixed: createInboundMixed(),
  },
  {
    id: DefaultInboundIds.Tun,
    type: InboundType.Tun,
    tag: 'tun-in',
    enable: false,
    tun: createInboundTun(),
  },
]
