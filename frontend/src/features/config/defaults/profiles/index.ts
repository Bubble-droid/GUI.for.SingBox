import { sampleID } from '@/utils'

import type { MixinConfig, Profile, ScriptConfig } from '@/features/config/types'

import { createDns } from './dns'
import { createExperimental } from './experimental'
import { createInbounds } from './inbounds'
import { createLog } from './log'
import { createNtp } from './ntp'
import { createOutbounds } from './outbounds'
import { createRoute } from './route'

export * from './shared'
export * from './log'
export * from './ntp'
export * from './experimental'
export * from './endpoints'
export * from './inbounds'
export * from './outbounds'
export * from './route'
export * from './dns'

export const ProfileSchemaVersion = 'v0.3.0'

export const createMixin = (): MixinConfig => {
  return { priority: 'mixin', format: 'json', config: '{}' }
}

export const createScript = (): ScriptConfig => {
  return { code: `const onGenerate = async (config) => {\n  return config\n}` }
}

export const createProfile = (name = ''): Profile => ({
  id: sampleID(),
  name,
  schema: ProfileSchemaVersion,
  log: createLog(),
  ntp: createNtp(),
  experimental: createExperimental(),
  endpoints: [],
  inbounds: createInbounds(),
  outbounds: createOutbounds(),
  route: createRoute(),
  dns: createDns(),
  mixin: createMixin(),
  script: createScript(),
})
