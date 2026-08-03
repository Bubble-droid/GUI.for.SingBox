import type { Endpoint } from '@features/constant/kernel'

import type { Switchable, Dialer, UdpNat } from './shared'

export interface WireGuardPeer {
  address: string
  port: number
  public_key: string
  pre_shared_key: string
  allowed_ips: string[]
  persistent_keepalive_interval: number
  reserved: string[]
}

export interface EndpointWireGuard extends Switchable {
  type: typeof Endpoint.WireGuard
  config: {
    system: boolean
    name: string
    mtu: number
    address: string[]
    private_key: string
    listen_port: number
    peers: WireGuardPeer[]
    workers: number
    dialer: Dialer
    udpNat: UdpNat
  }
}

export interface EndpointTailscale extends Switchable {
  type: typeof Endpoint.Tailscale
  config: {
    dialer: Dialer
  }
}

export type EndpointConfig = EndpointWireGuard | EndpointTailscale
