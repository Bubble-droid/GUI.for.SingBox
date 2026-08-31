import type { HttpEngine, HttpVersion } from '@features/constant/kernel'

import type { Recordable } from '@/types'

import type { Dialer, Http2Options, OutboundTlsConfig, QuicOptions, Switchable } from './shared'

export interface HttpClientConfig extends Switchable {
  config: {
    engine: HttpEngine
    version: HttpVersion
    disable_version_fallback: boolean
    headers: Recordable<string>
    http2: Http2Options
    quic: QuicOptions
    tls: OutboundTlsConfig
    dialer: Dialer
  }
}
