import type { EndpointTailscale } from './tailscale'
import type { EndpointWireGuard } from './wireguard'

export type * from './wireguard'
export type * from './tailscale'

export type EndpointConfig = EndpointWireGuard | EndpointTailscale
