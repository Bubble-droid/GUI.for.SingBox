import { Endpoint } from '@/enums'

import type { EndpointConfig } from '@/features/config/types'

import { createWireGuard } from './wireguard'

export * from './wireguard'

type Result<T extends Endpoint> = Extract<EndpointConfig, { type: T }>

export const createEndpoint = <T extends Endpoint>(type: T): Result<T> => {
  switch (type) {
    case Endpoint.WireGuard:
      return createWireGuard() as Result<T>

    default:
      throw `Unexpected endpoint type: ${type}`
  }
}
