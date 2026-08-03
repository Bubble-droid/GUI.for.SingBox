import { Inbound } from '@features/constant/kernel'
import type { InboundConfig } from '@profiles/inbounds'

export const generateInbounds = (inbounds: InboundConfig[]) => {
  return inbounds.flatMap((inbound) => {
    if (!inbound.enable) return []
    if (inbound.type !== Inbound.Tun && inbound.type !== Inbound.Direct) {
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
    if (inbound.type === Inbound.Direct) {
      return {
        type: inbound.type,
        tag: inbound.tag,
        ...inbound[inbound.type]!.listen,
        network: inbound.direct!.network || undefined,
      }
    }
    if (inbound.type === Inbound.Tun) {
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
}
