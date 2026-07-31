import type { MessageSchema } from '../types'

export const shared = {
  network: {
    default: 'Default All',
    tcp: 'TCP',
    udp: 'UDP',
    icmp: 'ICMP',
  },
} satisfies MessageSchema['shared']
