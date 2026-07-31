import { DefaultOutbounds, DefaultRoute, DefaultDns } from '@/constant'
import { sampleID } from '@/utils'

import type { MixinConfig, Profile, ScriptConfig } from '@/features/config/types'

import { createDefaultExperimental } from './experimental'
import { DefaultInbounds } from './inbounds'
import { createDefaultLog } from './log'

export * from './log'
export * from './experimental'
export * from './inbounds'
export * from './outbounds'
export * from './route'
export * from './dns'

export const ProfileSchemaVersion = 'v0.1.0'

export const DefaultMixin = (): MixinConfig => {
  return { priority: 'mixin', format: 'json', config: '{}' }
}

export const DefaultScript = (): ScriptConfig => {
  return { code: `const onGenerate = async (config) => {\n  return config\n}` }
}

export const createDefaultProfile = (name = ''): Profile => ({
  id: sampleID(),
  name,
  schema: ProfileSchemaVersion,
  log: createDefaultLog(),
  experimental: createDefaultExperimental(),
  inbounds: DefaultInbounds(),
  outbounds: DefaultOutbounds(),
  route: DefaultRoute(),
  dns: DefaultDns(),
  mixin: DefaultMixin(),
  script: DefaultScript(),
})
