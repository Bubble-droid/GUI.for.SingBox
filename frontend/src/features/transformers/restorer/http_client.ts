import { createHttpClient } from '@defaults/http_client'
import type { SingBoxHttpClient } from '@features/types/sing-box'
import type { HttpClientConfig } from '@profiles/http_client'

import { sampleID } from '@/utils/others'

import {
  restoreDialer,
  restoreHttp2Options,
  restoreOutboundTls,
  restoreQuicOptions,
} from './shared'
import type { IdMaps } from './types'

export const restoreHttpClients = (
  httpClients: SingBoxHttpClient[] = [],
  maps: IdMaps,
): HttpClientConfig[] => {
  const template = createHttpClient()
  return httpClients.map((raw) => {
    const { tag, ...reset } = raw
    const id = maps.httpClients.get(tag) ?? sampleID()

    const { dialer, rest: r1 } = restoreDialer(reset, maps)
    const tls = restoreOutboundTls(r1.tls)

    const { http2 } = restoreHttp2Options(r1)
    const { quic, rest: r2 } = restoreQuicOptions(r1)

    return {
      ...template,
      id,
      tag,
      config: {
        ...template.config,
        ...r2,
        headers: (r2.headers ?? {}) as Recordable<string>,
        http2,
        quic,
        tls,
        dialer,
      },
    }
  })
}
