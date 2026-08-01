import type { OutboundConfig, Profile } from '@/features/config/types'

export type GuiOutbound = Pick<OutboundConfig, 'exclude' | 'include' | 'hidden' | 'icon' | 'tag'>

export interface RestoreProfileOptions {
  profile?: Pick<Profile, 'id' | 'mixin' | 'script'> & {
    outbounds: GuiOutbound[]
  }
  subscriptionIds?: string[]
}

export interface IdMaps {
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
