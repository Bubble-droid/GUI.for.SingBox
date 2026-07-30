import type { MessageSchema } from '../types'

export const experimental = {
  clash_api: {
    external_controller: 'External Controller',
    external_ui: 'External UI',
    external_ui_download_url: 'Web UI Download URL',
    external_ui_download_detour: 'Web UI Download Detour',
    secret: 'RESTful API Secret',
    default_mode: 'Mode',
    access_control_allow_origin: 'CORS allowed origins',
    access_control_allow_private_network: 'Allow access from private network',
  },
  cache_file: {
    enabled: 'Enabled',
    path: 'Path to the cache file',
    cache_id: 'Identifier in the cache file',
    store_fakeip: 'Store Fake-IP',
    store_rdrc: 'Store Rejected DNS Response',
    rdrc_timeout: 'Timeout of rejected DNS response cache',
  },
} satisfies MessageSchema['experimental']
