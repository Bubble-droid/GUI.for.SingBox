import { Endpoint } from '@/enums'

import type { EndpointWireGuard, WireGuardPeer } from '@/features/config/types'

import { createDialer, createSwitchable, createUdpNat } from '../shared'

export const createWireGuardPeer = (): WireGuardPeer => ({
  address: '127.0.0.1',
  port: 10001,
  public_key: '',
  pre_shared_key: '',
  allowed_ips: [],
  persistent_keepalive_interval: 0,
  reserved: [],
})

export const createWireGuard = (): EndpointWireGuard => {
  const type = Endpoint.WireGuard
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      mtu: 0,
      address: [],
      private_key: '',
      listen_port: 0,
      peers: [],
      workers: 0,
      udpNat: createUdpNat(),
      dialer: createDialer(),
    },
  }
}
