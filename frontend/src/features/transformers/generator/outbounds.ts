import { Outbound } from '@features/constant/kernel'
import type { SingBoxOutbound, SingBoxOutboundOf } from '@features/types/sing-box'
import type { OutboundConfig } from '@profiles/outbounds'

import { ReadFile } from '@/bridge/io'

import { createTextMatcher } from '@/utils/others'

import type { Recordable } from '@/types'

import type { GenerateContext } from './types'

export const generateOutbounds = async (outbounds: OutboundConfig[], ctx: GenerateContext) => {
  const result: Recordable[] = []
  const SubscriptionCache: Recordable<SingBoxOutbound[]> = {}
  const proxiesSet = new Set<SingBoxOutbound>()
  const builtInProxiesSet = new Set<string>()

  for (const outbound of outbounds) {
    const _outbound: Partial<SingBoxOutboundOf<'urltest'>> = {
      type: outbound.type as typeof Outbound.UrlTest,
      tag: outbound.tag,
    }
    if (outbound.type === Outbound.UrlTest) {
      _outbound.url = outbound.url
      _outbound.interval = outbound.interval as NonNullable<
        SingBoxOutboundOf<'urltest'>['interval']
      >
      _outbound.tolerance = outbound.tolerance
    }
    if (outbound.type === Outbound.Selector || outbound.type === Outbound.UrlTest) {
      _outbound.interrupt_exist_connections = outbound.interrupt_exist_connections
      _outbound.outbounds = []
      const isTagMatching = createTextMatcher(outbound.include, outbound.exclude)
      for (const proxy of outbound.outbounds) {
        if (proxy.type === 'Built-in') {
          if (([Outbound.Direct, Outbound.Block] as string[]).includes(proxy.id)) {
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
              const proxies = JSON.parse(subStr) as SingBoxOutbound[]
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
