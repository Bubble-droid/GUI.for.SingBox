import { InboundType } from '@profile/constant/kernel'
import type { InboundItem } from '@profile/types/profiles/inbound'

export const generateInbounds = (inbounds: InboundItem[]) =>
  inbounds.flatMap((inbound) => {
    if (!inbound.enable) {
      return []
    }
    if (inbound.type !== InboundType.Tun && inbound.type !== InboundType.Direct) {
      const users = inbound[inbound.type]!.users.map((user) => ({
        username: user.split(':')[0],
        password: user.split(':')[1],
      }))
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound[inbound.type]!.listen,
        users: users.length > 0 ? users : undefined,
      }
    }
    if (inbound.type === InboundType.Direct) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound[inbound.type]!.listen,
        network: inbound.direct!.network || undefined,
      }
    }
    if (inbound.type === InboundType.Tun) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound.tun!,
        route_address: inbound.tun!.route_address?.length ? inbound.tun!.route_address : undefined,
        route_exclude_address: inbound.tun!.route_exclude_address?.length
          ? inbound.tun!.route_exclude_address
          : undefined,
      }
    }
    return []
  })
