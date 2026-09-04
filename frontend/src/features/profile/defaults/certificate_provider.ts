import type {
  AcmeKeyType,
  AcmeProvider,
  CloudflareRequestType,
  CloudflareValidity,
} from '@profile/constant/kernel'
import { CertProviderType } from '@profile/constant/kernel'
import type {
  AcmeCertProvider,
  CertProviderItem,
  CloudflareCertProvider,
  TailscaleCertProvider,
} from '@profile/types/profiles/certificate_provider'

import { createDns01Challenge, createSwitchable } from './shared'

type Result<T extends CertProviderType> = Extract<CertProviderItem, { type: T }>

const createAcme = (): AcmeCertProvider => {
  const type = CertProviderType.Acme
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
      external_account: {
        key_id: '',
        mac_key: '',
      },
      dns01_challenge: createDns01Challenge(),
      key_type: '' as AcmeKeyType,
      profile: '',
      http_client: '',
    },
  }
}

const createTailscale = (): TailscaleCertProvider => {
  const type = CertProviderType.Tailscale
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-provider`,
    config: {
      endpoint: '',
    },
  }
}

const createCloudflare = (): CloudflareCertProvider => {
  const type = CertProviderType.Cloudflare
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-provider`,
    config: {
      domain: [],
      data_directory: '',
      api_token: '',
      origin_ca_key: '',
      request_type: '' as CloudflareRequestType,
      requested_validity: 0 as CloudflareValidity,
      http_client: '',
    },
  }
}

export const createCertProvider = <T extends CertProviderType>(type: T): Result<T> => {
  switch (type) {
    case CertProviderType.Acme: {
      return createAcme() as Result<T>
    }
    case CertProviderType.Tailscale: {
      return createTailscale() as Result<T>
    }
    case CertProviderType.Cloudflare: {
      return createCloudflare() as Result<T>
    }
    default: {
      throw new Error(`Unexpected certificate provider type: ${type}`)
    }
  }
}
