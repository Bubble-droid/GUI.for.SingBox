import { NetnsType } from '@profile/constant/kernel'
import { createNetns } from '@profile/defaults/netns'
import type { DefaultNetns, NetnsItem, UnshareNetns } from '@profile/types/profiles/netns'
import type { NetworkNamespace, NetworkNamespaceOf } from '@profile/types/sing-box/config'

import { sampleID } from '@/utils/others'

import type { IdMaps } from './types'

const restoreNetnsDefault = (
  raw: NetworkNamespaceOf<typeof NetnsType.Default>,
  maps: IdMaps,
): DefaultNetns => {
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

const restoreNetnsUnshare = (
  raw: NetworkNamespaceOf<typeof NetnsType.Unshare>,
  maps: IdMaps,
): UnshareNetns => {
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

export const restoreNetns = (maps: IdMaps, raw: NetworkNamespace[] = []): NetnsItem[] =>
  raw.map((netns) => {
    switch (netns.type) {
      case NetnsType.Unshare: {
        return restoreNetnsUnshare(netns, maps)
      }
      default: {
        return restoreNetnsDefault(netns, maps)
      }
    }
  })
