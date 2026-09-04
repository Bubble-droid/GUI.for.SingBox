import { InboundType } from '@profile/constant/kernel'
import {
  createInboundTun,
  createInboundDirect,
  createInboundMixed,
} from '@profile/defaults/inbound'
import type { InboundItem } from '@profile/types/profiles/inbound'

import type { Recordable } from '@/types/typescript'

export const restoreInbounds = (inbounds: Recordable[], InboundsIds: Recordable): InboundItem[] =>
  inbounds.flatMap((raw) => {
    if (
      ![
        InboundType.Mixed,
        InboundType.Http,
        InboundType.Socks,
        InboundType.Tun,
        InboundType.Direct,
      ].includes(raw['type'])
    ) {
      return []
    }
    const inbound: InboundItem = {
      id: InboundsIds[raw['tag']],
      tag: raw['tag'],
      type: raw['type'],
      enable: true,
    }
    if (raw['type'] === InboundType.Tun) {
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
    if (raw['type'] === InboundType.Direct) {
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
    if ([InboundType.Mixed, InboundType.Http, InboundType.Socks].includes(raw['type'])) {
      const template = createInboundMixed()
      inbound[
        raw['type'] as Exclude<InboundType, typeof InboundType.Tun | typeof InboundType.Direct>
      ] = {
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
