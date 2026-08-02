import { Endpoint } from '@/enums'
import { filterInvalidProps } from '@/features/utils'

import type { EndpointConfig, SingBoxEndpoint } from '@/features/config/types'

import type { TagMaps } from '../types'
import { generateWireGuard } from './wireguard'

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
