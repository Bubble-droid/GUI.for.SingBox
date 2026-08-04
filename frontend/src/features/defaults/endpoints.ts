import { Endpoint } from '@features/constant/kernel'
import type {
  EndpointConfig,
  EndpointTailscale,
  EndpointWireGuard,
  WireGuardPeer,
} from '@profiles/endpoints'

import { createSwitchable, createUdpNat, createDialer } from './shared'

type Result<T extends Endpoint> = Extract<EndpointConfig, { type: T }>

export const createEndpoint = <T extends Endpoint>(type: T): Result<T> => {
  switch (type) {
    case Endpoint.WireGuard:
      return createWireGuard() as Result<T>
    case Endpoint.Tailscale:
      return createTailscale() as Result<T>
    default:
      throw `Unexpected endpoint type: ${type}`
  }
}

export const createWireGuardPeer = (): WireGuardPeer => ({
  address: '127.0.0.1',
  port: 10001,
  public_key: '',
  pre_shared_key: '',
  allowed_ips: [],
  persistent_keepalive_interval: 0,
  reserved: [],
})

export const createWireGuard = (): EndpointWireGuard => {
  const type = Endpoint.WireGuard
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      mtu: 0,
      address: [],
      private_key: '',
      listen_port: 0,
      peers: [],
      workers: 0,
      udpNat: createUdpNat(),
      dialer: createDialer(),
    },
  }
}

export const createTailscale = (): EndpointTailscale => {
  const type = Endpoint.Tailscale
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      state_directory: '',
      auth_key: '',
      control_url: '',
      ephemeral: false,
      hostname: '',
      accept_routes: false,
      exit_node: '',
      exit_node_allow_lan_access: false,
      advertise_routes: [],
      advertise_exit_node: false,
      advertise_tags: [],
      relay_server_port: 0,
      relay_server_static_endpoints: [],
      system_interface: false,
      system_interface_name: '',
      system_interface_mtu: 0,
      udp_timeout: '',
      ssh_server: {
        enabled: false,
        disable_pty: false,
        disable_sftp: false,
        disable_forwarding: false,
      },
      dialer: createDialer(),
    },
  }
}
