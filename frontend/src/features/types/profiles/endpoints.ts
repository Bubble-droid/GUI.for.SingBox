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

export interface SshServer {
  enabled: boolean
  disable_pty: boolean
  disable_sftp: boolean
  disable_forwarding: boolean
}

export interface EndpointTailscale extends Switchable {
  type: typeof Endpoint.Tailscale
  config: {
    state_directory: string
    auth_key: string
    control_url: string
    ephemeral: boolean
    hostname: string
    accept_routes: boolean
    exit_node: string
    exit_node_allow_lan_access: boolean
    advertise_routes: string[]
    advertise_exit_node: boolean
    advertise_tags: string[]
    relay_server_port: number
    relay_server_static_endpoints: string[]
    system_interface: boolean
    system_interface_name: string
    system_interface_mtu: number
    udp_timeout: string
    ssh_server: SshServer
    dialer: Dialer
  }
}

export type EndpointConfig = EndpointWireGuard | EndpointTailscale
