import type { MessageSchema } from '../types'

export const endpoints = {
  title: 'Endpoints',
  type: {
    title: 'Endpoint Type',
    wireguard: 'WireGuard',
    tailscale: 'Tailscale',
    openconnect: 'OpenConnect Client',
    'openvpn-client': 'OpenVPN Client',
    'openvpn-server': 'OpenVPN Server',
  },
  tag: 'Endpoint Tag',
  wireguard: {
    system: 'System Interface',
    name: 'Interface Name',
    mtu: 'MTU',
    address: 'Interface Address',
    private_key: 'Private Key',
    listen_port: 'Listen Port',
    peers: {
      title: 'Peers',
      address: 'Peer Address',
      port: 'Peer Port',
      public_key: 'Public Key',
      pre_shared_key: 'Pre-shared Key',
      allowed_ips: 'Allowed IPs',
      persistent_keepalive_interval: 'Keepalive Interval',
      reserved: 'Reserved Bytes',
    },
    workers: 'Worker Count',
  },
} satisfies MessageSchema['endpoints']
