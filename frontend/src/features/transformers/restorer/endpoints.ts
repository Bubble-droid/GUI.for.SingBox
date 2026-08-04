import { createWireGuardPeer, createEndpoint } from '@defaults/endpoints'
import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { ensureArray } from '@features/utils/helper'
import type {
  WireGuardPeer,
  EndpointWireGuard,
  EndpointConfig,
  EndpointTailscale,
} from '@profiles/endpoints'

import { sampleID } from '@/utils'

import { restoreDialer, restoreUdpNat } from './shared'
import type { IdMaps } from './types'

export const restoreEndpoints = (
  endpoints: SingBoxEndpoint[] = [],
  maps: IdMaps,
): EndpointConfig[] => {
  return endpoints.flatMap((raw): EndpointConfig[] => {
    switch (raw.type) {
      case Endpoint.WireGuard:
        return [restoreWireGuard(raw, maps)]
      case Endpoint.Tailscale:
        return [restoreTailscale(raw, maps)]
      default:
        return []
    }
  })
}

const restorePeers = (
  peers: SingBoxEndpointOf<typeof Endpoint.WireGuard>['peers'] = [],
): WireGuardPeer[] => {
  const peer = createWireGuardPeer()
  return peers.map((p) => {
    const { allowed_ips, reserved, ...rest } = p
    return {
      ...peer,
      ...rest,
      allowed_ips: ensureArray(allowed_ips),
      reserved: ensureArray(reserved).map(String),
    }
  })
}

export const restoreWireGuard = (
  wireguard: SingBoxEndpointOf<typeof Endpoint.WireGuard>,
  maps: IdMaps,
): EndpointWireGuard => {
  const { type, tag, ...rest } = wireguard
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.WireGuard)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      address: ensureArray(final.address),
      peers: restorePeers(final.peers),
      dialer,
      udpNat,
    },
  }
}

export const restoreTailscale = (
  tailscale: SingBoxEndpointOf<typeof Endpoint.Tailscale>,
  maps: IdMaps,
): EndpointTailscale => {
  const { type, tag, ...rest } = tailscale
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.Tailscale)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...reset1,
      advertise_routes: ensureArray(reset1.advertise_routes),
      advertise_tags: ensureArray((reset1 as any).advertise_tags),
      relay_server_static_endpoints: ensureArray(reset1.relay_server_static_endpoints),
      ssh_server: restoreSshServer(reset1.ssh_server, template.config),
      dialer,
    },
  }
}

export const restoreSshServer = (
  sshServer: SingBoxEndpointOf<typeof Endpoint.Tailscale>['ssh_server'],
  config: EndpointTailscale['config'],
): EndpointTailscale['config']['ssh_server'] => {
  if (typeof sshServer === 'boolean') {
    return { ...config.ssh_server, enabled: sshServer }
  }
  return { ...config.ssh_server, ...sshServer }
}
