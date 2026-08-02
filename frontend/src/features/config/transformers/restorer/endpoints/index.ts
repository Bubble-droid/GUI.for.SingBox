import { Endpoint } from '@/enums'

import type { EndpointConfig, SingBoxEndpoint } from '@/features/config/types'

import type { IdMaps } from '../types'
import { restoreWireGuard } from './wireguard'

export const restoreEndpoints = (
  endpoints: SingBoxEndpoint[] = [],
  maps: IdMaps,
): EndpointConfig[] => {
  return endpoints.flatMap((raw): EndpointConfig[] => {
    switch (raw.type) {
      case Endpoint.WireGuard:
        return [restoreWireGuard(raw, maps)]
      default:
        return []
    }
  })
}
