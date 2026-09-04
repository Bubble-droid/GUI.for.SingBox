import type {
  AcmeKeyType,
  AcmeProvider,
  CertProviderType,
  CloudflareRequestType,
  CloudflareValidity,
} from '@profile/constant/kernel'

import type { Switchable, HttpClientId, Dns01ChallengeForm } from './shared'

type TailscaleId = string

export interface ExternalAccount {
  key_id: string
  mac_key: string
}

export interface AcmeCertProvider extends Switchable {
  type: typeof CertProviderType.Acme
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
    dns01_challenge: Dns01ChallengeForm
    key_type: AcmeKeyType
    profile: string
    http_client: HttpClientId
  }
}

export interface TailscaleCertProvider extends Switchable {
  type: typeof CertProviderType.Tailscale
  config: {
    endpoint: TailscaleId
  }
}

export interface CloudflareCertProvider extends Switchable {
  type: typeof CertProviderType.Cloudflare
  config: {
    domain: string[]
    data_directory: string
    api_token: string
    origin_ca_key: string
    request_type: CloudflareRequestType
    requested_validity: CloudflareValidity
    http_client: HttpClientId
  }
}

export type CertProviderItem = AcmeCertProvider | TailscaleCertProvider | CloudflareCertProvider
