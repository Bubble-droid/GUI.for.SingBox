import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type { EndpointWireGuard, EndpointConfig, EndpointTailscale } from '@profiles/endpoints'

import { generateDialer, generateUdpNat } from './shared'
import type { TagMaps } from './types'

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
        case Endpoint.Tailscale:
          return [generateTailscale(ep, maps)]
        default:
          throw `Unexpected endpoint type: ${type as string}`
      }
    })
    .map(filterInvalidProps)
}

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

export const generateTailscale = (
  tailscale: EndpointTailscale,
  maps: TagMaps,
): SingBoxEndpointOf<typeof Endpoint.Tailscale> => {
  const { type, tag, config } = tailscale
  const { dialer, ...rest } = config
  return {
    ...rest,
    ...generateDialer(dialer, maps),
    type,
    tag,
    udp_timeout: rest.udp_timeout as any,
    ssh_server: rest.ssh_server.enabled
      ? { ...filterInvalidProps(rest.ssh_server), enabled: true }
      : undefined,
  }
}
