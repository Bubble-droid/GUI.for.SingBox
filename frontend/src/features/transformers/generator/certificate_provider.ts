import { CertificateProviderType } from '@features/constant/kernel'
import type { SingBoxCertificateProvider } from '@features/types/sing-box'
import { filterInvalidProps } from '@features/utils/helper'
import type {
  CertificateProviderConfig,
  CertificateProviderAcme,
  CertificateProviderTailscale,
  CertificateProviderCloudflareOriginCa,
} from '@profiles/certificate_provider'

import { generateDns01Challenge } from './shared'
import type { TagMaps } from './types'

export const generateCertificateProviders = (
  providers: CertificateProviderConfig[],
  maps: TagMaps,
): SingBoxCertificateProvider[] => {
  return providers
    .flatMap((cp): SingBoxCertificateProvider[] => {
      const { enable, type } = cp
      if (!enable) return []
      switch (type) {
        case CertificateProviderType.Acme:
          return [generateAcmeProvider(cp, maps)]
        case CertificateProviderType.Tailscale:
          return [generateTailscaleProvider(cp, maps)]
        case CertificateProviderType.CloudflareOriginCa:
          return [generateCloudflareOriginCaProvider(cp, maps)]
        default:
          throw `Unexpected certificate provider type: ${type as string}`
      }
    })
    .map(filterInvalidProps)
}

export const generateAcmeProvider = (
  acme: CertificateProviderAcme,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = acme

  return filterInvalidProps({
    type,
    tag,
    ...config,
    external_account: filterInvalidProps(config.external_account),
    dns01_challenge: generateDns01Challenge(config.dns01_challenge, maps),
    http_client: maps.httpClients.get(config.http_client),
  })
}

export const generateTailscaleProvider = (
  tailscale: CertificateProviderTailscale,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = tailscale

  return filterInvalidProps({
    type,
    tag,
    endpoint: maps.endpoints.get(config.endpoint),
  })
}

export const generateCloudflareOriginCaProvider = (
  cf: CertificateProviderCloudflareOriginCa,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = cf

  return filterInvalidProps({
    type,
    tag,
    ...config,
    http_client: maps.httpClients.get(config.http_client),
  })
}
