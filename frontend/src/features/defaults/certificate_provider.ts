import type {
  AcmeKeyType,
  AcmeProvider,
  CloudflareOriginCaRequestType,
  CloudflareOriginCaValidity,
} from '@features/constant/kernel'
import { CertificateProviderType } from '@features/constant/kernel'
import type {
  CertificateProviderConfig,
  CertificateProviderAcme,
  CertificateProviderTailscale,
  CertificateProviderCloudflareOriginCa,
  ExternalAccount,
} from '@profiles/certificate_provider'

import { createDns01Challenge, createSwitchable } from './shared'

type Result<T extends CertificateProviderType> = Extract<CertificateProviderConfig, { type: T }>

export const createCertificateProvider = <T extends CertificateProviderType>(
  type: T,
): Result<T> => {
  switch (type) {
    case CertificateProviderType.Acme: {
      return createAcmeProvider() as Result<T>
    }
    case CertificateProviderType.Tailscale: {
      return createTailscaleProvider() as Result<T>
    }
    case CertificateProviderType.CloudflareOriginCa: {
      return createCloudflareOriginCaProvider() as Result<T>
    }
    default: {
      throw new Error(`Unexpected certificate provider type: ${type}`)
    }
  }
}

export const createExternalAccount = (): ExternalAccount => ({
  key_id: '',
  mac_key: '',
})

export const createAcmeProvider = (): CertificateProviderAcme => {
  const type = CertificateProviderType.Acme
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-provider`,
    config: {
      domain: [],
      data_directory: '',
      default_server_name: '',
      email: '',
      provider: '' as AcmeProvider,
      account_key: '',
      disable_http_challenge: false,
      disable_tls_alpn_challenge: false,
      alternative_http_port: 0,
      alternative_tls_port: 0,
      external_account: createExternalAccount(),
      dns01_challenge: createDns01Challenge(),
      key_type: '' as AcmeKeyType,
      profile: '',
      http_client: '',
    },
  }
}

export const createTailscaleProvider = (): CertificateProviderTailscale => {
  const type = CertificateProviderType.Tailscale
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-provider`,
    config: {
      endpoint: '',
    },
  }
}

export const createCloudflareOriginCaProvider = (): CertificateProviderCloudflareOriginCa => {
  const type = CertificateProviderType.CloudflareOriginCa
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-provider`,
    config: {
      domain: [],
      data_directory: '',
      api_token: '',
      origin_ca_key: '',
      request_type: '' as CloudflareOriginCaRequestType,
      requested_validity: 0 as CloudflareOriginCaValidity,
      http_client: '',
    },
  }
}
