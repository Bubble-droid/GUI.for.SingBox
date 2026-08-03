import { Endpoint } from '@features/constant/kernel'
import type { EndpointConfig, EndpointWireGuard, WireGuardPeer } from '@profiles/endpoints'

import { createSwitchable, createUdpNat, createDialer } from './shared'

type Result<T extends Endpoint> = Extract<EndpointConfig, { type: T }>

export const createEndpoint = <T extends Endpoint>(type: T): Result<T> => {
  switch (type) {
    case Endpoint.WireGuard:
      return createWireGuard() as Result<T>

    default:
      throw `Unexpected endpoint type: ${type}`
  }
}

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

export const createWireGuardPeer = (): WireGuardPeer => ({
  address: '127.0.0.1',
  port: 10001,
  public_key: '',
  pre_shared_key: '',
  allowed_ips: [],
  persistent_keepalive_interval: 0,
  reserved: [],
})
