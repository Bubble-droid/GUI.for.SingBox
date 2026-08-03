import type { Profile } from '@profiles'
import type { OutboundConfig } from '@profiles/outbounds'

export type GuiOutbound = Pick<OutboundConfig, 'exclude' | 'include' | 'hidden' | 'icon' | 'tag'>

export interface RestoreProfileOptions {
  profile?: Pick<Profile, 'id' | 'mixin' | 'script'> & {
    outbounds: GuiOutbound[]
  }
  subscriptionIds?: string[]
}

export interface IdMaps {
  endpoints: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
