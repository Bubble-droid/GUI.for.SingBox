import type { Mixin, Profile, Script } from '@profiles'

import { sampleID } from '@/utils/others'

import { createCertificate } from './certificate'
import { createDns } from './dns'
import { createExperimental } from './experimental'
import { createInbounds } from './inbounds'
import { createLog } from './log'
import { createNtp } from './ntp'
import { createOutbounds } from './outbounds'
import { createRoute } from './route'

export const ProfileSchemaVersion = 'v0.8.0'

export const createMixin = (): Mixin => ({ priority: 'mixin', format: 'json', config: '{}' })

export const createScript = (): Script => ({
  code: `const onGenerate = async (config) => {\n  return config\n}`,
})

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
