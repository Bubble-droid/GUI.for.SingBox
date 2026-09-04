import { OutboundType } from '@profile/constant/kernel'
import type { OutboundItem } from '@profile/types/profiles/outbounds'
import type { Outbound, OutboundOf } from '@profile/types/sing-box/config'

import { ReadFile } from '@/bridge/io'

import { createTextMatcher } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import type { GenerateContext } from './types'

export const generateOutbounds = async (outbounds: OutboundItem[], ctx: GenerateContext) => {
  const result: Recordable[] = []
  const SubscriptionCache: Recordable<Outbound[]> = {}
  const proxiesSet = new Set<Outbound>()
  const builtInProxiesSet = new Set<string>()

  for (const outbound of outbounds) {
    const _outbound: Partial<OutboundOf<'urltest'>> = {
      type: outbound.type as typeof OutboundType.UrlTest,
      tag: outbound.tag,
    }
    if (outbound.type === OutboundType.UrlTest) {
      _outbound.url = outbound.url
      _outbound.interval = outbound.interval as NonNullable<OutboundOf<'urltest'>['interval']>
      _outbound.tolerance = outbound.tolerance
    }
    if (outbound.type === OutboundType.Selector || outbound.type === OutboundType.UrlTest) {
      _outbound.interrupt_exist_connections = outbound.interrupt_exist_connections
      _outbound.outbounds = []
      const isTagMatching = createTextMatcher(outbound.include, outbound.exclude)
      for (const proxy of outbound.outbounds) {
        if (proxy.type === 'Built-in') {
          if (([OutboundType.Direct, OutboundType.Block] as string[]).includes(proxy.id)) {
            builtInProxiesSet.add(proxy.id)
          }
          _outbound.outbounds.push(proxy.tag)
        } else {
          const subId = proxy.type === 'Subscription' ? proxy.id : proxy.type
          let targetSub = SubscriptionCache[subId] ?? []
          if (targetSub.length === 0) {
            const sub = ctx.getSubscribe(subId)
            if (sub) {
              const subStr = await ReadFile(sub.path)
              const proxies = JSON.parse(subStr) as Outbound[]
              SubscriptionCache[subId] = proxies
              targetSub = proxies
            }
          }
          if (proxy.type === 'Subscription') {
            _outbound.outbounds.push(
              ...targetSub.map((v) => v.tag).filter((tag) => isTagMatching(tag)),
            )
            targetSub.forEach((v) => {
              proxiesSet.add(v)
            })
          } else {
            const _proxy = targetSub.find((v) => v.tag === proxy.tag)
            if (_proxy && isTagMatching(_proxy.tag)) {
              _outbound.outbounds.push(_proxy.tag)
              proxiesSet.add(_proxy)
            }
          }
        }
      }
    }
    result.push(_outbound)
  }

  result.push(...proxiesSet, ...[...builtInProxiesSet].map((v) => ({ type: v, tag: v })))

  return result
}
