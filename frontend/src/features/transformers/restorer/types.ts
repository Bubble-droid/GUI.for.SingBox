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
  certProviders: Map<string, string>
  httpClients: Map<string, string>
  netns: Map<string, string>
  endpoints: Map<string, string>
  inbounds: Map<string, string>
  outbounds: Map<string, string>
  dnsServers: Map<string, string>
}
