import { OutboundType } from '@profile/constant/kernel'
import { createOutbound } from '@profile/defaults/outbound'
import type { OutboundChild, OutboundItem } from '@profile/types/profiles/outbound'

import { createTextMatcher } from '@/utils/others'

import type { Subscription } from '@/types/app'
import type { Recordable } from '@/types/typescript'

import type { RestoreContext } from './types'

export const restoreOutbounds = (
  outbounds: Recordable[],
  OutboundsIds: Recordable,
  originalOutbounds: OutboundItem[],
  subscriptionIds: string[],
  ctx: RestoreContext,
): OutboundItem[] => {
  const subscriptionCache = new Map<string, Subscription>()
  const proxyToSubMap = new Map<string, { sub: string; id: string }>()
  const originalOutboundMap = new Map<string, OutboundItem>()

  const groupTags = new Set(
    outbounds
      .filter((o: Recordable) => [OutboundType.Selector, OutboundType.UrlTest].includes(o['type']))
      .map((o: Recordable) => o['tag']),
  )

  subscriptionIds.forEach((id) => {
    const sub = ctx.getSubscribe(id)
    if (sub) {
      subscriptionCache.set(id, sub)
      sub.proxies.forEach((proxy) => {
        proxyToSubMap.set(proxy.tag, { sub: id, id: proxy.id })
      })
    }
  })

  originalOutbounds.forEach((outbound) => {
    originalOutboundMap.set(outbound.tag, outbound)
  })

  return outbounds.flatMap((raw) => {
    if (![OutboundType.Selector, OutboundType.UrlTest].includes(raw['type'])) {
      return []
    }
    const outbound = createOutbound()
    outbound.id = OutboundsIds[raw['tag']]
    outbound.tag = raw['tag']
    outbound.type = raw['type']

    let newOutbounds: OutboundChild[] = []

    raw['outbounds']?.forEach((tag: string) => {
      const isBuiltIn = [OutboundType.Direct, OutboundType.Block].includes(tag as any)
      if (isBuiltIn) {
        newOutbounds.push({ id: tag, type: 'Built-in', tag })
      } else if (groupTags.has(tag)) {
        const id = OutboundsIds[tag]
        if (id) {
          newOutbounds.push({ id, type: 'Built-in', tag })
        }
      } else {
        const proxy = proxyToSubMap.get(tag)
        if (proxy) {
          newOutbounds.push({ id: proxy.id, type: proxy.sub, tag })
        }
      }
    })

    const originalGroup = originalOutboundMap.get(outbound.tag)
    if (originalGroup) {
      outbound.icon = originalGroup.icon
      outbound.hidden = originalGroup.hidden
      outbound.include = originalGroup.include
      outbound.exclude = originalGroup.exclude

      const currentNonBuiltInIds = new Set(
        newOutbounds.filter((v) => v.type !== 'Built-in').map((v) => v.id),
      )

      subscriptionIds.forEach((id) => {
        const sub = subscriptionCache.get(id)
        if (sub) {
          const isTagMatching = createTextMatcher(originalGroup.include, originalGroup.exclude)
          const matchedProxies = sub.proxies.filter((proxy) => isTagMatching(proxy.tag))

          const isAllMatched =
            matchedProxies.length > 0 &&
            matchedProxies.every((proxy) => currentNonBuiltInIds.has(proxy.id))

          if (isAllMatched) {
            const matchedIds = new Set(matchedProxies.map((p) => p.id))
            newOutbounds = newOutbounds.filter(
              (v) => v.type === 'Built-in' || !matchedIds.has(v.id),
            )
            newOutbounds.push({ id: sub.id, type: 'Subscription', tag: sub.name })

            matchedIds.forEach((matchedId) => currentNonBuiltInIds.delete(matchedId))
          }
        }
      })
    }

    outbound.outbounds = newOutbounds

    if ('interrupt_exist_connections' in raw) {
      outbound.interrupt_exist_connections = raw['interrupt_exist_connections']
    }
    if (OutboundType.UrlTest === raw['type']) {
      if ('url' in raw) {
        outbound.url = raw['url']
      }
      if ('interval' in raw) {
        outbound.interval = raw['interval']
      }
      if ('tolerance' in raw) {
        outbound.tolerance = raw['tolerance']
      }
    }
    return outbound
  })
}
