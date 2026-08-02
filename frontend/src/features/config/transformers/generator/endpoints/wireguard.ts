import { filterInvalidProps } from '@/features/utils'

import type { Endpoint } from '@/enums'
import type { EndpointWireGuard, SingBoxEndpointOf } from '@/features/config/types'

import { generateDialer, generateUdpNat } from '../shared'
import type { TagMaps } from '../types'

export const generateWireGuard = (
  wireguard: EndpointWireGuard,
  maps: TagMaps,
): SingBoxEndpointOf<typeof Endpoint.WireGuard> => {
  const { type, tag, config } = wireguard
  const { dialer, udpNat, ...rest } = config
  return {
    ...rest,
    ...generateDialer(dialer, maps),
    ...generateUdpNat(udpNat),
    peers: rest.peers
      .map((v) => ({ ...v, reserved: v.reserved.map(Number) }))
      .map(filterInvalidProps),
    type,
    tag,
  }
}
