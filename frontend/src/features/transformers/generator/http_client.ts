import type { SingBoxHttpClient } from '@features/types/sing-box'
import type { HttpClientConfig } from '@profiles/http_client'

import {
  generateDialer,
  generateHttp2Options,
  generateOutboundTls,
  generateQuicOptions,
} from './shared'
import type { TagMaps } from './types'

export const generateHttpClients = (
  httpClients: HttpClientConfig[],
  maps: TagMaps,
): SingBoxHttpClient[] => {
  return httpClients
    .filter((hc) => hc.enable)
    .map((hc): SingBoxHttpClient => {
      const { tag, config } = hc
      const { http2, quic, tls, dialer, version, ...rest } = config

      const http2OrQuicProps =
        version === 3 ? generateQuicOptions(quic) : version === 2 ? generateHttp2Options(http2) : {}

      return {
        ...rest,
        ...http2OrQuicProps,
        ...generateDialer(dialer, maps),
        tag,
        version,
        tls: generateOutboundTls(tls),
      }
    })
}
