import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import type {
  EndpointWireGuard,
  EndpointConfig,
  EndpointTailscale,
  EndpointOpenConnect,
  EndpointOpenVpnClient,
  EndpointOpenVpnServer,
} from '@profiles/endpoints'

import { generateDialer, generateUdpNat, generateListen } from './shared'
import type { TagMaps } from './types'

export const generateEndpoints = (endpoints: EndpointConfig[], maps: TagMaps): SingBoxEndpoint[] =>
  endpoints
    .filter((ep) => ep.enable)
    .map((ep): SingBoxEndpoint => {
      const { type } = ep
      switch (type) {
        case Endpoint.WireGuard: {
          return generateWireGuard(ep, maps)
        }
        case Endpoint.Tailscale: {
          return generateTailscale(ep, maps)
        }
        case Endpoint.OpenConnect: {
          return generateOpenConnect(ep, maps)
        }
        case Endpoint.OpenVpnClient: {
          return generateOpenVpnClient(ep, maps)
        }
        case Endpoint.OpenVpnServer: {
          return generateOpenVpnServer(ep, maps)
        }
        default: {
          throw new Error(`Unexpected endpoint type: ${type as string}`)
        }
      }
    })

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
    type,
    tag,
    peers: rest.peers.map((v) => ({ ...v, reserved: v.reserved.map(Number) })),
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
    ssh_server: rest.ssh_server.enabled ? { ...rest.ssh_server } : undefined,
  } as SingBoxEndpointOf<typeof Endpoint.Tailscale>
}

export const generateOpenConnect = (
  openconnect: EndpointOpenConnect,
  maps: TagMaps,
): SingBoxEndpointOf<typeof Endpoint.OpenConnect> => {
  const { type, tag, config } = openconnect
  const { dialer, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateDialer(dialer, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as SingBoxEndpointOf<typeof Endpoint.OpenConnect>
}

export const generateOpenVpnClient = (
  openvpn: EndpointOpenVpnClient,
  maps: TagMaps,
): SingBoxEndpointOf<typeof Endpoint.OpenVpnClient> => {
  const { type, tag, config } = openvpn
  const { dialer, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateDialer(dialer, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as SingBoxEndpointOf<typeof Endpoint.OpenVpnClient>
}

export const generateOpenVpnServer = (
  openvpn: EndpointOpenVpnServer,
  maps: TagMaps,
): SingBoxEndpointOf<typeof Endpoint.OpenVpnServer> => {
  const { type, tag, config } = openvpn
  const { listen, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateListen(listen, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as unknown as SingBoxEndpointOf<typeof Endpoint.OpenVpnServer>
}
