import type {
  CertificateProviderType,
  AcmeKeyType,
  CloudflareOriginCaRequestType,
  CloudflareOriginCaValidity,
  AcmeProvider,
} from '@features/constant/kernel'

import type { Switchable, HttpClientId, Dns01Challenge } from './shared'

type TailscaleId = string

export interface ExternalAccount {
  key_id: string
  mac_key: string
}

export interface CertificateProviderAcme extends Switchable {
  type: typeof CertificateProviderType.Acme
  config: {
    domain: string[]
    data_directory: string
    default_server_name: string
    email: string
    provider: AcmeProvider
    account_key: string
    disable_http_challenge: boolean
    disable_tls_alpn_challenge: boolean
    alternative_http_port: number
    alternative_tls_port: number
    external_account: ExternalAccount
    dns01_challenge: Dns01Challenge
    key_type: AcmeKeyType
    profile: string
    http_client: HttpClientId
  }
}

export interface CertificateProviderTailscale extends Switchable {
  type: typeof CertificateProviderType.Tailscale
  config: {
    endpoint: TailscaleId
  }
}

export interface CertificateProviderCloudflareOriginCa extends Switchable {
  type: typeof CertificateProviderType.CloudflareOriginCa
  config: {
    domain: string[]
    data_directory: string
    api_token: string
    origin_ca_key: string
    request_type: CloudflareOriginCaRequestType
    requested_validity: CloudflareOriginCaValidity
    http_client: HttpClientId
  }
}

export type CertificateProviderConfig =
  | CertificateProviderAcme
  | CertificateProviderTailscale
  | CertificateProviderCloudflareOriginCa
