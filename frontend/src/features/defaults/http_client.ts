import type { HttpEngine } from '@features/constant/kernel'
import { HttpVersion } from '@features/constant/kernel'
import type { HttpClientConfig } from '@profiles/http_client'

import {
  createSwitchable,
  createHttp2Options,
  createQuicOptions,
  createDialer,
  createOutboundTls,
} from './shared'

export const createHttpClient = (): HttpClientConfig => ({
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
