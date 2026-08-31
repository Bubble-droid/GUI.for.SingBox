import { createInboundTun, createInboundDirect, createInboundMixed } from '@defaults/inbounds'
import { Inbound } from '@features/constant/kernel'
import type { InboundConfig } from '@profiles/inbounds'

import type { Recordable } from '@/types'

export const restoreInbounds = (inbounds: Recordable[], InboundsIds: Recordable): InboundConfig[] =>
  inbounds.flatMap((raw) => {
    if (
      ![Inbound.Mixed, Inbound.Http, Inbound.Socks, Inbound.Tun, Inbound.Direct].includes(
        raw['type'],
      )
    ) {
      return []
    }
    const inbound: InboundConfig = {
      id: InboundsIds[raw['tag']],
      tag: raw['tag'],
      type: raw['type'],
      enable: true,
    }
    if (raw['type'] === Inbound.Tun) {
      const template = createInboundTun()
      inbound.tun = {
        interface_name: raw['interface_name'] ?? template.interface_name,
        address: raw['address'] ?? template.address,
        mtu: raw['mtu'] ?? template.mtu,
        auto_route: raw['auto_route'] ?? template.auto_route,
        strict_route: raw['strict_route'] ?? template.strict_route,
        route_address: raw['route_address'] ?? template.route_address,
        route_exclude_address: raw['route_exclude_address'] ?? template.route_exclude_address,
        endpoint_independent_nat:
          raw['endpoint_independent_nat'] ?? template.endpoint_independent_nat,
        stack: raw['stack'] ?? template.stack,
      }
    }
    if (raw['type'] === Inbound.Direct) {
      const template = createInboundDirect()
      inbound.direct = {
        listen: {
          listen: raw['listen'] ?? template.listen.listen,
          listen_port: raw['listen_port'] ?? template.listen.listen_port,
          tcp_fast_open: raw['tcp_fast_open'] ?? template.listen.tcp_fast_open,
          tcp_multi_path: raw['tcp_multi_path'] ?? template.listen.tcp_multi_path,
          udp_fragment: raw['udp_fragment'] ?? template.listen.udp_fragment,
        },
        network: raw['network'] ?? template.network,
      }
    }
    if ([Inbound.Mixed, Inbound.Http, Inbound.Socks].includes(raw['type'])) {
      const template = createInboundMixed()
      inbound[raw['type'] as Exclude<Inbound, typeof Inbound.Tun | typeof Inbound.Direct>] = {
        listen: {
          listen: raw['listen'] ?? template.listen.listen,
          listen_port: raw['listen_port'] ?? template.listen.listen_port,
          tcp_fast_open: raw['tcp_fast_open'] ?? template.listen.tcp_fast_open,
          tcp_multi_path: raw['tcp_multi_path'] ?? template.listen.tcp_multi_path,
          udp_fragment: raw['udp_fragment'] ?? template.listen.udp_fragment,
        },
        users:
          raw['users']?.map((user: any) => `${user.username}:${user.password}`) ?? template.users,
      }
    }
    return inbound
  })
