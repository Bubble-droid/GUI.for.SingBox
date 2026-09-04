import type { MessageSchema } from '../types'

export default {
  clash_api: {
    title: 'Clash API Configuration',
    external_controller: 'Clash API Listen Address',
    external_ui: 'Web UI Resource Path',
    external_ui_download_url: 'Web UI Download URL',
    external_ui_download_detour: 'Web UI Download Detour',
    secret: 'Clash API Secret',
    default_mode: 'Default Work Mode',
    access_control_allow_origin: 'Allowed CORS Origins',
    access_control_allow_private_network: 'Allow Access from Private Network',
  },
  cache_file: {
    title: 'Cache File Configuration',
    enabled: 'Enable Cache',
    path: 'Cache File Path',
    cache_id: 'Cache Identifier',
    store_fakeip: 'Store FakeIP',
    store_dns: 'Store DNS',
  },
} satisfies MessageSchema['experimental']
