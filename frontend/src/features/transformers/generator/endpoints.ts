import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
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
        case Endpoint.OpenConnect:
          return [generateOpenConnect(ep, maps)]
        case Endpoint.OpenVpnClient:
          return [generateOpenVpnClient(ep, maps)]
        case Endpoint.OpenVpnServer:
          return [generateOpenVpnServer(ep, maps)]
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
    ssh_server: (rest.ssh_server.enabled
      ? { ...filterInvalidProps(rest.ssh_server), enabled: true }
      : undefined) as NonNullable<SingBoxEndpointOf<typeof Endpoint.Tailscale>['ssh_server']>,
  }
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
    token: filterInvalidProps(rest.token),
    mobile: filterInvalidProps(rest.mobile),
    csd: filterInvalidProps(rest.csd),
    hip: filterInvalidProps(rest.hip),
    tncc: filterInvalidProps({
      ...rest.tncc,
      certificates: rest.tncc.certificates
        .map(filterInvalidProps)
        .filter((c) => Object.keys(c).length > 0),
    }),
    fortinet_host_check: filterInvalidProps(rest.fortinet_host_check),
    tls: filterInvalidProps(rest.tls),
    form_entries: rest.form_entries
      .map(filterInvalidProps)
      .filter((f) => Object.keys(f).length > 0),
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
    servers: rest.servers.map(filterInvalidProps).filter((s) => Object.keys(s).length > 0),
    pull_filters: rest.pull_filters
      .map(filterInvalidProps)
      .filter((f) => Object.keys(f).length > 0),
    tls: filterInvalidProps({
      ...rest.tls,
      control_wrap: filterInvalidProps(rest.tls.control_wrap),
    }),
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
    users: rest.users.map(filterInvalidProps).filter((u) => Object.keys(u).length > 0),
    tls: filterInvalidProps({
      ...rest.tls,
      control_wrap: filterInvalidProps(rest.tls.control_wrap),
    }),
    push: filterInvalidProps({
      ...rest.push,
      dns_servers: rest.push.dns_servers
        .map(filterInvalidProps)
        .filter((d) => Object.keys(d).length > 0),
    }),
    type,
    tag,
  } as unknown as SingBoxEndpointOf<typeof Endpoint.OpenVpnServer>
}
