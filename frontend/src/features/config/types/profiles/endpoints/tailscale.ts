import type { Endpoint } from '@/enums'

import type { Dialer, Switchable } from '../shared'

export interface EndpointTailscale extends Switchable {
  type: typeof Endpoint.Tailscale
  config: {
    dialer: Dialer
  }
}
