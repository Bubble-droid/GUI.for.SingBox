import { createNetns } from '@defaults/netns'
import { NetnsType } from '@features/constant/kernel'
import type { SingBoxNetns, SingBoxNetnsOf } from '@features/types/sing-box'
import type { NetnsConfig, NetnsDefault, NetnsUnshare } from '@profiles/netns'

import { sampleID } from '@/utils/others'

import type { IdMaps } from './types'

export const restoreNetns = (raw: SingBoxNetns[] = [], maps: IdMaps): NetnsConfig[] => {
  return raw.map((netns): NetnsConfig => {
    switch (netns.type) {
      case NetnsType.Unshare:
        return restoreNetnsUnshare(netns, maps)
      default:
        return restoreNetnsDefault(netns, maps)
    }
  })
}

export const restoreNetnsDefault = (
  raw: SingBoxNetnsOf<typeof NetnsType.Default>,
  maps: IdMaps,
): NetnsDefault => {
  const { type = NetnsType.Default, tag, ...rest } = raw
  const id = maps.netns.get(tag) ?? sampleID()
  const template = createNetns(type)
  return {
    ...template,
    id,
    tag,
    type,
    config: {
      ...template.config,
      ...rest,
    },
  }
}

export const restoreNetnsUnshare = (
  raw: SingBoxNetnsOf<typeof NetnsType.Unshare>,
  maps: IdMaps,
): NetnsUnshare => {
  const { type, tag, ...rest } = raw
  const id = maps.netns.get(tag) ?? sampleID()
  const template = createNetns(type)
  return {
    ...template,
    id,
    tag,
    type,
    config: {
      ...template.config,
      ...rest,
    },
  }
}
