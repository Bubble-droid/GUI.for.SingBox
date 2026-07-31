import type { Profile } from '@/features/config/types'

export interface RestoreProfileOptions {
  profile?: Profile
  subscriptionIds?: string[]
}

export interface IdMaps {
  outbounds: Map<string, string>
}
