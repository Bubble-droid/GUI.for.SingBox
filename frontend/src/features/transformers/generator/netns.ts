import { NetnsType } from '@features/constant/kernel'
import type { SingBoxNetns } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type { NetnsConfig } from '@profiles/netns'

export const generateNetns = (netns: NetnsConfig[]) => {
  return netns
    .flatMap((ns): SingBoxNetns[] => {
      const { enable, type, tag, config } = ns
      if (!enable) return []
      switch (type) {
        case NetnsType.Default:
        case NetnsType.Unshare:
          return [{ type, tag, ...config } as SingBoxNetns]
        default:
          throw new Error(`Unexpected netns type: ${type as string}`)
      }
    })
    .map((ns) => filterInvalidProps(ns))
}
