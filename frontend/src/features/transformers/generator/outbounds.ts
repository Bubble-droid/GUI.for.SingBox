import { Outbound } from '@features/constant/kernel'
import type { OutboundConfig } from '@profiles/outbounds'

import { ReadFile } from '@/bridge'
import { useSubscribesStore } from '@/stores'
import { createTextMatcher } from '@/utils'

export const generateOutbounds = async (outbounds: OutboundConfig[]) => {
  const result: Recordable[] = []
  const SubscriptionCache: Recordable<any[]> = {}
  const proxiesSet = new Set<any>()
  const builtInProxiesSet = new Set<string>()

  const subscribesStore = useSubscribesStore()

  for (const outbound of outbounds) {
    const _outbound: Recordable = {
      type: outbound.type,
      tag: outbound.tag,
    }
    if (outbound.type === Outbound.UrlTest) {
      _outbound.url = outbound.url
      _outbound.interval = outbound.interval
      _outbound.tolerance = outbound.tolerance
    }
    if (outbound.type === Outbound.Selector || outbound.type === Outbound.UrlTest) {
      _outbound.interrupt_exist_connections = outbound.interrupt_exist_connections
      _outbound.outbounds = []
      const isTagMatching = createTextMatcher(outbound.include, outbound.exclude)
      for (const proxy of outbound.outbounds) {
        if (proxy.type === 'Built-in') {
          if ([Outbound.Direct, Outbound.Block].includes(proxy.id as any)) {
            builtInProxiesSet.add(proxy.id)
          }
          _outbound.outbounds.push(proxy.tag)
        } else {
          const subId = proxy.type === 'Subscription' ? proxy.id : proxy.type
          const targetSub = SubscriptionCache[subId] ?? []
          if (!targetSub) {
            const sub = subscribesStore.getSubscribeById(subId)
            if (sub) {
              const subStr = await ReadFile(sub.path)
              const proxies = JSON.parse(subStr)
              SubscriptionCache[subId] = proxies
            }
          }
          if (proxy.type === 'Subscription') {
            _outbound.outbounds.push(
              ...targetSub?.map((v) => v.tag).filter((tag) => isTagMatching(tag)),
            )
            targetSub.forEach((v) => proxiesSet.add(v))
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

  result.push(...proxiesSet)
  result.push(...Array.from(builtInProxiesSet).map((v) => ({ type: v, tag: v })))

  return result
}
