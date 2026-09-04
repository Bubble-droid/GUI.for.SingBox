import { CertProviderType } from '@profile/constant/kernel'
import type {
  AcmeCertProvider,
  CertProviderItem,
  CloudflareCertProvider,
  TailscaleCertProvider,
} from '@profile/types/profiles/cert-provider'
import type { CertificateProvider, CertificateProviderOf } from '@profile/types/sing-box/config'

import { generateDns01Challenge } from './shared'
import type { TagMaps } from './types'

const generateAcmeProvider = (
  acme: AcmeCertProvider,
  maps: TagMaps,
): CertificateProviderOf<'acme'> => {
  const { type, tag, config } = acme

  return {
    ...config,
    type,
    tag,
    dns01_challenge: generateDns01Challenge(config.dns01_challenge, maps),
    http_client: maps.httpClients.get(config.http_client),
  }
}

const generateTailscaleProvider = (
  tailscale: TailscaleCertProvider,
  maps: TagMaps,
): CertificateProviderOf<'tailscale'> => {
  const { type, tag, config } = tailscale

  return {
    type,
    tag,
    endpoint: maps.endpoints.get(config.endpoint) ?? '',
  }
}

const generateCloudflareProvider = (
  cf: CloudflareCertProvider,
  maps: TagMaps,
): CertificateProviderOf<'cloudflare-origin-ca'> => {
  const { type, tag, config } = cf

  return {
    ...config,
    type,
    tag,
    http_client: maps.httpClients.get(config.http_client),
  }
}

export const generateCertProviders = (
  providers: CertProviderItem[],
  maps: TagMaps,
): CertificateProvider[] =>
  providers
    .filter((cp) => cp.enable)
    .map((cp): CertificateProvider => {
      const { type } = cp
      switch (type) {
        case CertProviderType.Acme: {
          return generateAcmeProvider(cp, maps)
        }
        case CertProviderType.Tailscale: {
          return generateTailscaleProvider(cp, maps)
        }
        case CertProviderType.Cloudflare: {
          return generateCloudflareProvider(cp, maps)
        }
        default: {
          throw new Error(`Unexpected certificate provider type: ${type as string}`)
        }
      }
    })
