import type { CertStore, HttpEngine } from '@profile/constant/kernel'
import { ClashMode, HttpVersion, LogLevel } from '@profile/constant/kernel'
import type {
  CertSection,
  ExperimentalSection,
  HttpClientItem,
  LogSection,
  Mixin,
  NtpSection,
  Profile,
  Script,
} from '@profile/types/profiles'

import { generateSecureKey, sampleID } from '@/utils/others'

import { createDns } from './dns'
import { createInbounds } from './inbound'
import { createOutbounds } from './outbound'
import { createRoute } from './route'
import {
  createDialer,
  createHttp2Options,
  createOutboundTls,
  createQuicOptions,
  createSwitchable,
  DefaultOutboundIds,
} from './shared'

export const ProfileSchemaVersion = 'v0.8.0'

export const createMixin = (): Mixin => ({ priority: 'mixin', format: 'json', config: '{}' })

export const createScript = (): Script => ({
  code: `const onGenerate = async (config) => {\n  return config\n}`,
})

export const createLog = (): LogSection => ({
  disabled: false,
  level: LogLevel.Info,
  output: '',
  timestamp: false,
})

export const createNtp = (): NtpSection => ({
  enabled: false,
  server: '',
  server_port: 123,
  interval: '',
  dialer: createDialer(),
})

export const createCert = (): CertSection => ({
  store: '' as CertStore,
  certificate: [],
  certificate_path: [],
  certificate_directory_path: [],
})

export const createHttpClient = (): HttpClientItem => ({
  ...createSwitchable(),
  tag: 'http-client',
  config: {
    engine: '' as HttpEngine,
    version: HttpVersion.V2,
    disable_version_fallback: false,
    headers: {},
    http2: createHttp2Options(),
    quic: createQuicOptions(),
    tls: createOutboundTls(),
    dialer: createDialer(),
  },
})

export const createExperimental = (): ExperimentalSection => ({
  clash_api: {
    external_controller: '127.0.0.1:20123',
    external_ui: '',
    external_ui_download_url: '',
    external_ui_download_detour: DefaultOutboundIds.Direct,
    secret: generateSecureKey(),
    default_mode: ClashMode.Rule,
    access_control_allow_origin: [],
    access_control_allow_private_network: false,
  },
  cache_file: {
    enabled: true,
    path: 'cache.db',
    cache_id: sampleID(),
    store_fakeip: false,
    store_dns: false,
  },
})

export const createProfile = (name = ''): Profile => ({
  id: sampleID(),
  name,
  schema: ProfileSchemaVersion,
  log: createLog(),
  ntp: createNtp(),
  experimental: createExperimental(),
  cert: createCert(),
  certProviders: [],
  httpClients: [],
  netns: [],
  endpoints: [],
  inbounds: createInbounds(),
  outbounds: createOutbounds(),
  route: createRoute(),
  dns: createDns(),
  mixin: createMixin(),
  script: createScript(),
})
