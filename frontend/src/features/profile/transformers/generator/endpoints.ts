import { EndpointType } from '@profile/constant/kernel'
import type {
  EndpointItem,
  OpenConnectEndpoint,
  OpenVpnClientEndpoint,
  OpenVpnServerEndpoint,
  TailscaleEndpoint,
  WireGuardEndpoint,
} from '@profile/types/profiles/endpoints'
import type { Endpoint, EndpointOf } from '@profile/types/sing-box/config'

import { generateDialer, generateUdpNat, generateListen } from './shared'
import type { TagMaps } from './types'

const generateWireGuard = (
  wireguard: WireGuardEndpoint,
  maps: TagMaps,
): EndpointOf<'wireguard'> => {
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

const generateTailscale = (
  tailscale: TailscaleEndpoint,
  maps: TagMaps,
): EndpointOf<'tailscale'> => {
  const { type, tag, config } = tailscale
  const { dialer, ...rest } = config
  return {
    ...rest,
    ...generateDialer(dialer, maps),
    type,
    tag,
    ssh_server: rest.ssh_server.enabled ? { ...rest.ssh_server } : undefined,
  } as EndpointOf<'tailscale'>
}

const generateOpenConnect = (openconnect: OpenConnectEndpoint, maps: TagMaps): Endpoint => {
  const { type, tag, config } = openconnect
  const { dialer, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateDialer(dialer, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as unknown as Endpoint
}

const generateOpenVpnClient = (
  openvpn: OpenVpnClientEndpoint,
  maps: TagMaps,
): EndpointOf<'openvpn-client'> => {
  const { type, tag, config } = openvpn
  const { dialer, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateDialer(dialer, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as EndpointOf<'openvpn-client'>
}

const generateOpenVpnServer = (
  openvpn: OpenVpnServerEndpoint,
  maps: TagMaps,
): EndpointOf<'openvpn-server'> => {
  const { type, tag, config } = openvpn
  const { listen, udpNat, ...rest } = config

  return {
    ...rest,
    ...generateListen(listen, maps),
    ...generateUdpNat(udpNat),
    type,
    tag,
  } as unknown as EndpointOf<'openvpn-server'>
}

export const generateEndpoints = (endpoints: EndpointItem[], maps: TagMaps): Endpoint[] =>
  endpoints
    .filter((ep) => ep.enable)
    .map((ep): Endpoint => {
      const { type } = ep
      switch (type) {
        case EndpointType.WireGuard: {
          return generateWireGuard(ep, maps)
        }
        case EndpointType.Tailscale: {
          return generateTailscale(ep, maps)
        }
        case EndpointType.OpenConnect: {
          return generateOpenConnect(ep, maps)
        }
        case EndpointType.OpenVpnClient: {
          return generateOpenVpnClient(ep, maps)
        }
        case EndpointType.OpenVpnServer: {
          return generateOpenVpnServer(ep, maps)
        }
        default: {
          throw new Error(`Unexpected endpoint type: ${type as string}`)
        }
      }
    })
