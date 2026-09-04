import type { AcmeProvider } from '@profile/constant/kernel'
import { CertProviderType } from '@profile/constant/kernel'
import { createCertProvider } from '@profile/defaults/cert-provider'
import type {
  AcmeCertProvider,
  CertProviderItem,
  CloudflareCertProvider,
  TailscaleCertProvider,
} from '@profile/types/profiles/cert-provider'
import type { CertificateProvider, CertificateProviderOf } from '@profile/types/sing-box/config'
import { normalizeArray } from '@profile/utils/helper'

import { sampleID } from '@/utils/others'

import { restoreDns01Challenge } from './shared'
import type { IdMaps } from './types'

const restoreAcmeProvider = (
  raw: CertificateProviderOf<typeof CertProviderType.Acme>,
  maps: IdMaps,
): AcmeCertProvider => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertProvider(CertProviderType.Acme)

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
      dns01_challenge: restoreDns01Challenge(maps, raw.dns01_challenge),
      http_client: maps.httpClients.get(raw.http_client as string) ?? '',
    },
  }
}

const restoreTailscaleProvider = (
  raw: CertificateProviderOf<typeof CertProviderType.Tailscale>,
  maps: IdMaps,
): TailscaleCertProvider => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertProvider(CertProviderType.Tailscale)

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

const restoreCloudflareProvider = (
  raw: CertificateProviderOf<typeof CertProviderType.Cloudflare>,
  maps: IdMaps,
): CloudflareCertProvider => {
  const { tag, type, ...rest } = raw
  const id = maps.certProviders.get(tag) ?? sampleID()
  const template = createCertProvider(CertProviderType.Cloudflare)

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

export const restoreCertProviders = (
  maps: IdMaps,
  providers: CertificateProvider[] = [],
): CertProviderItem[] =>
  providers.flatMap((raw): CertProviderItem[] => {
    switch (raw.type) {
      case CertProviderType.Acme: {
        return [restoreAcmeProvider(raw, maps)]
      }
      case CertProviderType.Tailscale: {
        return [restoreTailscaleProvider(raw, maps)]
      }
      case CertProviderType.Cloudflare: {
        return [restoreCloudflareProvider(raw, maps)]
      }
      default: {
        return []
      }
    }
  })
