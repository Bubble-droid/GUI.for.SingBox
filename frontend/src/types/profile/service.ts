import type { Service } from '@/enums'

import type { SwitchableProfile, Listen, Dialer, HttpClientId } from './shared'

interface StandardServiceProfile extends SwitchableProfile {
  type: Exclude<Service, typeof Service.UsbipClient | typeof Service.Api>
  config: {
    listen: Listen
  }
}

export interface ApiServiceProfile extends SwitchableProfile {
  type: typeof Service.Api
  config: {
    listen: Listen
    secret: string
    access_control_allow_origin: string[]
    access_control_allow_private_network: boolean
    dashboard: {
      enabled: boolean
      path: string
      download_url: string
      http_client: HttpClientId
      update_interval: string
    }
  }
}

interface UsbipClientServiceProfile extends SwitchableProfile {
  type: typeof Service.UsbipClient
  config: {
    dialer: Dialer
  }
}

export type ServiceProfile = StandardServiceProfile | UsbipClientServiceProfile | ApiServiceProfile
