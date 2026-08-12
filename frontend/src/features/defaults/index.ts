import type { Profile } from '@profiles'
import type { MixinConfig, ScriptConfig } from '@profiles/mixin-script'

import { sampleID } from '@/utils/secure'

import { createCertificate } from './certificate'
import { createDns } from './dns'
import { createExperimental } from './experimental'
import { createInbounds } from './inbounds'
import { createLog } from './log'
import { createNtp } from './ntp'
import { createOutbounds } from './outbounds'
import { createRoute } from './route'

export const ProfileSchemaVersion = 'v0.8.0'

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
  certificate: createCertificate(),
  certificate_providers: [],
  http_clients: [],
  network_namespaces: [],
  endpoints: [],
  inbounds: createInbounds(),
  outbounds: createOutbounds(),
  route: createRoute(),
  dns: createDns(),
  mixin: createMixin(),
  script: createScript(),
})
