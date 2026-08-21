import { createCertificateProvider } from '@defaults/certificate_provider'
import type { AcmeProvider } from '@features/constant/kernel'
import { CertificateProviderType } from '@features/constant/kernel'
import type {
  SingBoxCertificateProvider,
  SingBoxCertificateProviderOf,
} from '@features/types/sing-box'
import { normalizeArray } from '@features/utils/helper'
import type {
  CertificateProviderConfig,
  CertificateProviderAcme,
  CertificateProviderTailscale,
  CertificateProviderCloudflareOriginCa,
} from '@profiles/certificate_provider'

import { sampleID } from '@/utils/others'

import { restoreDns01Challenge } from './shared'
import type { IdMaps } from './types'

export const restoreCertificateProviders = (
  providers: SingBoxCertificateProvider[] = [],
  maps: IdMaps,
): CertificateProviderConfig[] => {
  return providers.flatMap((raw): CertificateProviderConfig[] => {
    switch (raw.type) {
      case CertificateProviderType.Acme:
        return [restoreAcmeProvider(raw, maps)]
      case CertificateProviderType.Tailscale:
        return [restoreTailscaleProvider(raw, maps)]
      case CertificateProviderType.CloudflareOriginCa:
        return [restoreCloudflareOriginCaProvider(raw, maps)]
      default:
        return []
    }
  })
}

export const restoreAcmeProvider = (
  raw: SingBoxCertificateProviderOf<typeof CertificateProviderType.Acme>,
  maps: IdMaps,
): CertificateProviderAcme => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertificateProvider(CertificateProviderType.Acme)

  return {
    ...template,
    id,
    tag,
    type,
    config: {
      ...template.config,
      ...rest,
      domain: normalizeArray(raw.domain),
      provider: raw.provider as AcmeProvider,
      external_account: {
        ...template.config.external_account,
        ...raw.external_account,
      },
      dns01_challenge: restoreDns01Challenge(raw.dns01_challenge, maps),
      http_client: maps.httpClients.get(raw.http_client as string) ?? '',
    },
  }
}

export const restoreTailscaleProvider = (
  raw: SingBoxCertificateProviderOf<typeof CertificateProviderType.Tailscale>,
  maps: IdMaps,
): CertificateProviderTailscale => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertificateProvider(CertificateProviderType.Tailscale)

  return {
    ...template,
    id,
    tag,
    type,
    config: {
      ...template.config,
      ...rest,
      endpoint: maps.endpoints.get(raw.endpoint) ?? '',
    },
  }
}

export const restoreCloudflareOriginCaProvider = (
  raw: SingBoxCertificateProviderOf<typeof CertificateProviderType.CloudflareOriginCa>,
  maps: IdMaps,
): CertificateProviderCloudflareOriginCa => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertificateProvider(CertificateProviderType.CloudflareOriginCa)

  return {
    ...template,
    id,
    tag,
    type,
    config: {
      ...template.config,
      ...rest,
      domain: normalizeArray(raw.domain),
      http_client: maps.httpClients.get(raw.http_client as string) ?? '',
    },
  }
}
