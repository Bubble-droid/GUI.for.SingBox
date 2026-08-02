import { createEndpoint } from '@/constant'
import { Endpoint } from '@/enums'
import { createWireGuardPeer } from '@/features/config/defaults/profiles/endpoints/wireguard'
import { ensureArray } from '@/features/utils'
import { sampleID } from '@/utils'

import type { EndpointWireGuard, SingBoxEndpointOf, WireGuardPeer } from '@/features/config/types'

import { restoreDialer, restoreUdpNat } from '../shared'
import type { IdMaps } from '../types'

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
