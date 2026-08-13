import { ClashMode } from '@features/constant/kernel'
import type { ExperimentalConfig } from '@profiles/experimental'

import { generateSecureKey, sampleID } from '@/utils/secure'

import { DefaultOutboundIds } from './shared'

export const createExperimental = (): ExperimentalConfig => ({
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
