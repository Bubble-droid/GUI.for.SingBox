import { NetnsType } from '@features/constant/kernel'
import type { SingBoxNetns } from '@features/types/sing-box'
import type { NetnsConfig } from '@profiles/netns'

export const generateNetns = (netns: NetnsConfig[]) => {
  return netns
    .filter((ns) => ns.enable)
    .map((ns): SingBoxNetns => {
      const { type, tag, config } = ns
      switch (type) {
        case NetnsType.Default:
        case NetnsType.Unshare:
          return { type, tag, ...config } as SingBoxNetns
        default:
          throw new Error(`Unexpected netns type: ${type as string}`)
      }
    })
}
