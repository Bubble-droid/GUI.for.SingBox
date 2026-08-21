import { CertificateProviderType } from '@features/constant/kernel'
import type { SingBoxCertificateProvider } from '@features/types/sing-box'
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
    .filter((cp) => cp.enable)
    .map((cp): SingBoxCertificateProvider => {
      const { type } = cp
      switch (type) {
        case CertificateProviderType.Acme:
          return generateAcmeProvider(cp, maps)
        case CertificateProviderType.Tailscale:
          return generateTailscaleProvider(cp, maps)
        case CertificateProviderType.CloudflareOriginCa:
          return generateCloudflareOriginCaProvider(cp, maps)
        default:
          throw new Error(`Unexpected certificate provider type: ${type as string}`)
      }
    })
}

export const generateAcmeProvider = (
  acme: CertificateProviderAcme,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = acme

  return {
    ...config,
    type,
    tag,
    dns01_challenge: generateDns01Challenge(config.dns01_challenge, maps),
    http_client: maps.httpClients.get(config.http_client),
  }
}

export const generateTailscaleProvider = (
  tailscale: CertificateProviderTailscale,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = tailscale

  return {
    type,
    tag,
    endpoint: maps.endpoints.get(config.endpoint) ?? '',
  }
}

export const generateCloudflareOriginCaProvider = (
  cf: CertificateProviderCloudflareOriginCa,
  maps: TagMaps,
): SingBoxCertificateProvider => {
  const { type, tag, config } = cf

  return {
    ...config,
    type,
    tag,
    http_client: maps.httpClients.get(config.http_client),
  }
}
