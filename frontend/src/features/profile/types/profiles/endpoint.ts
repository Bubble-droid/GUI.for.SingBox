import type {
  OpenConnectFlavor,
  OpenConnectTokenMode,
  OpenConnectReportedOs,
  OpenConnectCompressionMode,
  OpenVpnMode,
  OpenVpnTopology,
  OpenVpnAuthRetry,
  OpenVpnKeyDirection,
  OpenVpnCertNameType,
  OpenVpnRemoteCertTls,
  OpenVpnCertProfile,
  OpenVpnNsCertType,
  OpenVpnControlWrapType,
  OpenVpnMssFixMode,
  OpenVpnCompression,
  OpenVpnCompressionLzo,
  OpenVpnAllowCompression,
  OpenVpnPullFilterAction,
  OpenVpnVerifyClientCert,
  OpenVpnDnsTransport,
  OpenVpnDnsSec,
  TlsVersion,
  TlsCipherSuite,
  Network,
  EndpointType,
} from '@profile/constant/kernel'

import type { DialerFormData, ListenFormData, Switchable, UdpNatFormData } from './shared'

export interface WireGuardPeer {
  address: string
  port: number
  public_key: string
  pre_shared_key: string
  allowed_ips: string[]
  persistent_keepalive_interval: number
  reserved: string[]
}

export interface WireGuardEndpoint extends Switchable {
  type: typeof EndpointType.WireGuard
  config: {
    system: boolean
    name: string
    mtu: number
    address: string[]
    private_key: string
    listen_port: number
    peers: WireGuardPeer[]
    workers: number
    dialer: DialerFormData
    udpNat: UdpNatFormData
  }
}

export interface SshServer {
  enabled: boolean
  disable_pty: boolean
  disable_sftp: boolean
  disable_forwarding: boolean
}

export interface TailscaleEndpoint extends Switchable {
  type: typeof EndpointType.Tailscale
  config: {
    state_directory: string
    auth_key: string
    control_url: string
    ephemeral: boolean
    hostname: string
    accept_routes: boolean
    exit_node: string
    exit_node_allow_lan_access: boolean
    advertise_routes: string[]
    advertise_exit_node: boolean
    advertise_tags: string[]
    relay_server_port: number
    relay_server_static_endpoints: string[]
    system_interface: boolean
    system_interface_name: string
    system_interface_mtu: number
    udp_timeout: string
    ssh_server: SshServer
    dialer: DialerFormData
  }
}

// OpenConnect
export interface OpenConnectToken {
  mode: OpenConnectTokenMode
  secret: string
  secret_path: string
  pin: string
  password: string
  device_id: string
  counter: number
}

export interface OpenConnectMobile {
  platform_version: string
  device_type: string
  device_unique_id: string
}

export interface OpenConnectCsd {
  wrapper_path: string
}

export interface OpenConnectHip {
  wrapper_path: string
}

export interface OpenConnectTnccCertificate {
  certificate: string[]
  certificate_path: string
}

export interface OpenConnectTncc {
  wrapper_path: string
  device_id: string
  user_agent: string
  machine_identification_enabled: boolean
  certificates: OpenConnectTnccCertificate[]
}

export interface OpenConnectFortinetHostCheck {
  hostcheck: string
  check_virtual_desktop: string
}

export interface OpenConnectTls {
  insecure: boolean
  server_name: string
  peer_fingerprint: string[]
  system_trust_disabled: boolean
  certificate_authority: string[]
  certificate_authority_path: string
  client_certificate: string[]
  client_certificate_path: string
  client_key: string[]
  client_key_path: string
  client_key_password: string
  mca_certificate: string[]
  mca_certificate_path: string
  mca_key: string[]
  mca_key_path: string
  mca_key_password: string
}

export interface OpenConnectFormEntry {
  form_id: string
  submission_key: string
  name: string
  value: string
  promote: boolean
}

export interface OpenConnectEndpoint extends Switchable {
  type: typeof EndpointType.OpenConnect
  config: {
    system: boolean
    name: string
    server: string
    flavor: OpenConnectFlavor
    username: string
    password: string
    auth_group: string
    cookie: string
    token: OpenConnectToken
    reported_os: OpenConnectReportedOs
    user_agent: string
    version: string
    local_hostname: string
    mobile: OpenConnectMobile
    csd: OpenConnectCsd
    hip: OpenConnectHip
    tncc: OpenConnectTncc
    fortinet_host_check: OpenConnectFortinetHostCheck
    no_udp: boolean
    dtls_local_port: number
    compression_disabled: boolean
    compression_mode: OpenConnectCompressionMode
    ipv6_disabled: boolean
    http_keepalive_disabled: boolean
    xml_post_disabled: boolean
    external_auth_disabled: boolean
    password_authentication_disabled: boolean
    tcp_keep_alive_enabled: boolean
    pfs: boolean
    mtu: number
    base_mtu: number
    dpd_interval: string
    reconnect_timeout: string
    trojan_interval: string
    queue_length: number
    allow_insecure_crypto: boolean
    tls: OpenConnectTls
    form_entries: OpenConnectFormEntry[]
    udpNat: UdpNatFormData
    dialer: DialerFormData
  }
}

// OpenVPN Shared
export interface OpenVpnControlWrap {
  type: OpenVpnControlWrapType
  key: string[]
  key_path: string
  direction: OpenVpnKeyDirection
  force_cookie: boolean
}

export interface OpenVpnClientTls {
  server_name: string
  server_name_type: OpenVpnCertNameType
  certificate: string[]
  certificate_path: string
  client_certificate: string[]
  client_certificate_path: string
  client_key: string[]
  client_key_path: string
  peer_fingerprint: string[]
  crl_path: string
  remote_certificate_ku: string[]
  remote_certificate_eku: string
  remote_certificate_tls: OpenVpnRemoteCertTls
  certificate_profile: OpenVpnCertProfile
  ns_certificate_type: OpenVpnNsCertType
  version_min: TlsVersion
  version_max: TlsVersion
  cipher: TlsCipherSuite
  groups: string
  control_wrap: OpenVpnControlWrap
}

export interface OpenVpnServerRemoteItem {
  server: string
  server_port: number
  network: Network
}

export interface OpenVpnPullFilter {
  action: OpenVpnPullFilterAction
  text: string
}

export interface OpenVpnClientEndpoint extends Switchable {
  type: typeof EndpointType.OpenVpnClient
  config: {
    system: boolean
    name: string
    mtu: number
    mode: OpenVpnMode
    server: string
    server_port: number
    servers: OpenVpnServerRemoteItem[]
    remote_random: boolean
    network: Network
    address: string[]
    peer_address: string
    peer_address_ipv6: string
    topology: OpenVpnTopology
    username: string
    password: string
    auth_retry: OpenVpnAuthRetry
    static_challenge: string
    static_challenge_echo: boolean
    static_key: string[]
    static_key_path: string
    key_direction: OpenVpnKeyDirection
    tls: OpenVpnClientTls
    cipher: string
    data_ciphers: string[]
    data_ciphers_fallback: string
    auth: string
    mss_fix: number
    mss_fix_disabled: boolean
    mss_fix_mode: OpenVpnMssFixMode
    fragment: number
    replay_window: number
    replay_window_time: string
    compression: OpenVpnCompression
    compression_lzo: OpenVpnCompressionLzo
    allow_compression: OpenVpnAllowCompression
    route_no_pull: boolean
    pull_filters: OpenVpnPullFilter[]
    routes: string[]
    route_gateway: string
    route_metric: number
    redirect_gateway: boolean
    redirect_gateway_flags: string[]
    redirect_private: boolean
    block_ipv6: boolean
    ping_interval: string
    ping_restart: string
    ping_restart_disabled: boolean
    renegotiate_interval: string
    renegotiate_disabled: boolean
    renegotiate_bytes: number
    renegotiate_packets: number
    tls_timeout: string
    handshake_window: string
    explicit_exit_notify: number
    udpNat: UdpNatFormData
    dialer: DialerFormData
  }
}

// OpenVPN Server
export interface OpenVpnUser {
  username: string
  password: string
}

export interface OpenVpnPushDnsServer {
  priority: number
  addresses: string[]
  resolve_domains: string[]
  dnssec: OpenVpnDnsSec
  transport: OpenVpnDnsTransport
  sni: string
}

export interface OpenVpnServerPush {
  routes: string[]
  dns: string[]
  dns_servers: OpenVpnPushDnsServer[]
  search_domains: string[]
  dhcp_options: string[]
  redirect_gateway: boolean
  redirect_gateway_flags: string[]
  block_outside_dns: boolean
  ping_interval: string
  ping_restart: string
}

export interface OpenVpnServerTls {
  certificate: string[]
  certificate_path: string
  key: string[]
  key_path: string
  client_certificate: string[]
  client_certificate_path: string
  verify_client_certificate: OpenVpnVerifyClientCert
  client_name: string
  client_name_type: OpenVpnCertNameType
  peer_fingerprint: string[]
  crl_path: string
  remote_certificate_ku: string[]
  remote_certificate_eku: string
  remote_certificate_tls: OpenVpnRemoteCertTls
  certificate_profile: OpenVpnCertProfile
  ns_certificate_type: OpenVpnNsCertType
  version_min: TlsVersion
  version_max: TlsVersion
  cipher: TlsCipherSuite
  groups: string
  control_wrap: OpenVpnControlWrap
}

export interface OpenVpnServerEndpoint extends Switchable {
  type: typeof EndpointType.OpenVpnServer
  config: {
    system: boolean
    name: string
    mtu: number
    mode: OpenVpnMode
    network: Network
    remote: string
    remote_port: number
    max_clients: number
    address: string[]
    peer_address: string
    peer_address_ipv6: string
    topology: OpenVpnTopology
    duplicate_cn: boolean
    users: OpenVpnUser[]
    static_key: string[]
    static_key_path: string
    key_direction: OpenVpnKeyDirection
    tls: OpenVpnServerTls
    cipher: string
    data_ciphers: string[]
    data_ciphers_fallback: string
    auth: string
    mss_fix: number
    mss_fix_disabled: boolean
    mss_fix_mode: OpenVpnMssFixMode
    replay_window: number
    replay_window_time: string
    push: OpenVpnServerPush
    ping_interval: string
    ping_restart: string
    renegotiate_interval: string
    renegotiate_disabled: boolean
    renegotiate_bytes: number
    renegotiate_packets: number
    handshake_window: string
    listen: ListenFormData
    udpNat: UdpNatFormData
  }
}

export type EndpointItem =
  | WireGuardEndpoint
  | TailscaleEndpoint
  | OpenConnectEndpoint
  | OpenVpnClientEndpoint
  | OpenVpnServerEndpoint
