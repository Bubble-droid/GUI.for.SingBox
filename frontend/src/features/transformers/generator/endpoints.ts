import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type { EndpointWireGuard, EndpointConfig } from '@profiles/endpoints'

import { generateDialer, generateUdpNat } from './shared'
import type { TagMaps } from './types'

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

export const generateEndpoints = (
  endpoints: EndpointConfig[],
  maps: TagMaps,
): SingBoxEndpoint[] => {
  return endpoints
    .flatMap((ep): SingBoxEndpoint[] => {
      const { enable, type } = ep
      if (!enable) return []
      switch (type) {
        case Endpoint.WireGuard:
          return [generateWireGuard(ep, maps)]

        default:
          throw `Unexpected endpoint type: ${type}`
      }
    })
    .map(filterInvalidProps)
}
