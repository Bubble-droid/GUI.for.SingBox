import type { MessageSchema } from '../types'

export default {
  title: 'Certificate Providers',
  tag: 'Provider Tag',
  type: {
    title: 'Provider Type',
    acme: 'ACME Automatic Certificate',
    tailscale: 'Tailscale Certificate',
    'cloudflare-origin-ca': 'Cloudflare Origin CA',
  },
  acme: {
    domain: 'Domains (Required)',
    data_directory: 'Data Directory',
    default_server_name: 'Default Server Name / SNI',
    email: 'ACME Account Email',
    provider: {
      title: 'ACME CA Provider',
      letsencrypt: "Let's Encrypt (Default)",
      zerossl: 'ZeroSSL',
      custom: 'Custom (URL)',
    },
    account_key: 'Account Private Key (PEM)',
    disable_http_challenge: 'Disable HTTP Challenge',
    disable_tls_alpn_challenge: 'Disable TLS-ALPN Challenge',
    alternative_http_port: 'Alternative HTTP Port',
    alternative_tls_port: 'Alternative TLS Port',
    external_account: {
      title: 'External Account Binding (EAB)',
      key_id: 'Key ID',
      mac_key: 'MAC Key',
    },
    key_type: {
      title: 'Key Type',
      ed25519: 'Ed25519',
      p256: 'P-256',
      p384: 'P-384',
      rsa2048: 'RSA 2048',
      rsa4096: 'RSA 4096',
    },
    profile: 'ACME Profile',
    http_client: 'HTTP Client',
  },
  tailscale: {
    endpoint: 'Associated Tailscale Endpoint',
  },
  cloudflare_origin_ca: {
    domain: 'Domains / Wildcard Domains (Required)',
    data_directory: 'Data Directory',
    api_token: 'Cloudflare API Token',
    origin_ca_key: 'Cloudflare Origin CA Key',
    request_type: {
      title: 'Signature Type',
      'origin-rsa': 'RSA (Default)',
      'origin-ecc': 'ECDSA P-256',
    },
    requested_validity: {
      title: 'Requested Certificate Validity',
      7: '7 Days',
      30: '30 Days',
      90: '90 Days',
      365: '365 Days (1 Years)',
      730: '730 Days (2 Years)',
      1095: '1095 Days (3 Years)',
      5475: '5475 Days (15 Years/Default)',
    },
    http_client: 'HTTP Client',
  },
} satisfies MessageSchema['certificate_providers']
