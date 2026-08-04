import type {
  OpenConnectFlavor,
  OpenConnectTokenMode,
  OpenConnectReportedOs,
  OpenConnectCompressionMode,
  OpenVpnMode,
  OpenVpnNetwork,
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
  CipherSuites,
  TlsVersion,
} from '@features/constant/kernel'
import { Endpoint } from '@features/constant/kernel'
import type {
  EndpointConfig,
  EndpointTailscale,
  EndpointWireGuard,
  EndpointOpenConnect,
  EndpointOpenVpnClient,
  EndpointOpenVpnServer,
  WireGuardPeer,
  OpenConnectTnccCertificate,
  OpenConnectFormEntry,
  OpenVpnServerRemoteItem,
  OpenVpnPullFilter,
  OpenVpnUser,
  OpenVpnPushDnsServer,
} from '@profiles/endpoints'

import { createSwitchable, createUdpNat, createDialer, createListen } from './shared'

type Result<T extends Endpoint> = Extract<EndpointConfig, { type: T }>

export const createEndpoint = <T extends Endpoint>(type: T): Result<T> => {
  switch (type) {
    case Endpoint.WireGuard:
      return createWireGuard() as Result<T>
    case Endpoint.Tailscale:
      return createTailscale() as Result<T>
    case Endpoint.OpenConnect:
      return createOpenConnect() as Result<T>
    case Endpoint.OpenVpnClient:
      return createOpenVpnClient() as Result<T>
    case Endpoint.OpenVpnServer:
      return createOpenVpnServer() as Result<T>
    default:
      throw `Unexpected endpoint type: ${type}`
  }
}

export const createWireGuardPeer = (): WireGuardPeer => ({
  address: '127.0.0.1',
  port: 10001,
  public_key: '',
  pre_shared_key: '',
  allowed_ips: [],
  persistent_keepalive_interval: 0,
  reserved: [],
})

export const createWireGuard = (): EndpointWireGuard => {
  const type = Endpoint.WireGuard
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      mtu: 0,
      address: [],
      private_key: '',
      listen_port: 0,
      peers: [],
      workers: 0,
      udpNat: createUdpNat(),
      dialer: createDialer(),
    },
  }
}

export const createTailscale = (): EndpointTailscale => {
  const type = Endpoint.Tailscale
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      state_directory: '',
      auth_key: '',
      control_url: '',
      ephemeral: false,
      hostname: '',
      accept_routes: false,
      exit_node: '',
      exit_node_allow_lan_access: false,
      advertise_routes: [],
      advertise_exit_node: false,
      advertise_tags: [],
      relay_server_port: 0,
      relay_server_static_endpoints: [],
      system_interface: false,
      system_interface_name: '',
      system_interface_mtu: 0,
      udp_timeout: '',
      ssh_server: {
        enabled: false,
        disable_pty: false,
        disable_sftp: false,
        disable_forwarding: false,
      },
      dialer: createDialer(),
    },
  }
}

export const createOpenConnectTnccCert = (): OpenConnectTnccCertificate => ({
  certificate: [],
  certificate_path: '',
})

export const createOpenConnectFormEntry = (): OpenConnectFormEntry => ({
  form_id: '',
  submission_key: '',
  name: '',
  value: '',
  promote: false,
})

export const createOpenConnect = (): EndpointOpenConnect => {
  const type = Endpoint.OpenConnect
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      server: '',
      flavor: '' as OpenConnectFlavor,
      username: '',
      password: '',
      auth_group: '',
      cookie: '',
      token: {
        mode: '' as OpenConnectTokenMode,
        secret: '',
        secret_path: '',
        pin: '',
        password: '',
        device_id: '',
        counter: 0,
      },
      reported_os: '' as OpenConnectReportedOs,
      user_agent: '',
      version: '',
      local_hostname: '',
      mobile: {
        platform_version: '',
        device_type: '',
        device_unique_id: '',
      },
      csd: {
        wrapper_path: '',
      },
      hip: {
        wrapper_path: '',
      },
      tncc: {
        wrapper_path: '',
        device_id: '',
        user_agent: '',
        machine_identification_enabled: false,
        certificates: [],
      },
      fortinet_host_check: {
        hostcheck: '',
        check_virtual_desktop: '',
      },
      no_udp: false,
      dtls_local_port: 0,
      compression_disabled: false,
      compression_mode: '' as OpenConnectCompressionMode,
      ipv6_disabled: false,
      http_keepalive_disabled: false,
      xml_post_disabled: false,
      external_auth_disabled: false,
      password_authentication_disabled: false,
      tcp_keep_alive_enabled: false,
      pfs: false,
      mtu: 0,
      base_mtu: 0,
      dpd_interval: '',
      reconnect_timeout: '',
      trojan_interval: '',
      queue_length: 0,
      allow_insecure_crypto: false,
      tls: {
        insecure: false,
        server_name: '',
        peer_fingerprint: [],
        system_trust_disabled: false,
        certificate_authority: [],
        certificate_authority_path: '',
        client_certificate: [],
        client_certificate_path: '',
        client_key: [],
        client_key_path: '',
        client_key_password: '',
        mca_certificate: [],
        mca_certificate_path: '',
        mca_key: [],
        mca_key_path: '',
        mca_key_password: '',
      },
      form_entries: [],
      udpNat: createUdpNat(),
      dialer: createDialer(),
    },
  }
}

export const createOpenVpnServerRemoteItem = (): OpenVpnServerRemoteItem => ({
  server: '',
  server_port: 1194,
  network: '' as OpenVpnNetwork,
})

export const createOpenVpnPullFilter = (): OpenVpnPullFilter => ({
  action: '' as OpenVpnPullFilterAction,
  text: '',
})

export const createOpenVpnClient = (): EndpointOpenVpnClient => {
  const type = Endpoint.OpenVpnClient
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      mtu: 0,
      mode: '' as OpenVpnMode,
      server: '',
      server_port: 0,
      servers: [],
      remote_random: false,
      network: '' as OpenVpnNetwork,
      address: [],
      peer_address: '',
      peer_address_ipv6: '',
      topology: '' as OpenVpnTopology,
      username: '',
      password: '',
      auth_retry: '' as OpenVpnAuthRetry,
      static_challenge: '',
      static_challenge_echo: false,
      static_key: [],
      static_key_path: '',
      key_direction: '' as OpenVpnKeyDirection,
      tls: {
        server_name: '',
        server_name_type: '' as OpenVpnCertNameType,
        certificate: [],
        certificate_path: '',
        client_certificate: [],
        client_certificate_path: '',
        client_key: [],
        client_key_path: '',
        peer_fingerprint: [],
        crl_path: '',
        remote_certificate_ku: [],
        remote_certificate_eku: '',
        remote_certificate_tls: '' as OpenVpnRemoteCertTls,
        certificate_profile: '' as OpenVpnCertProfile,
        ns_certificate_type: '' as OpenVpnNsCertType,
        version_min: '' as TlsVersion,
        version_max: '' as TlsVersion,
        cipher: '' as CipherSuites,
        groups: '',
        control_wrap: {
          type: '' as OpenVpnControlWrapType,
          key: [],
          key_path: '',
          direction: '' as OpenVpnKeyDirection,
          force_cookie: false,
        },
      },
      cipher: '',
      data_ciphers: [],
      data_ciphers_fallback: '',
      auth: '',
      mss_fix: 0,
      mss_fix_disabled: false,
      mss_fix_mode: '' as OpenVpnMssFixMode,
      fragment: 0,
      replay_window: 0,
      replay_window_time: '',
      compression: '' as OpenVpnCompression,
      compression_lzo: '' as OpenVpnCompressionLzo,
      allow_compression: '' as OpenVpnAllowCompression,
      route_no_pull: false,
      pull_filters: [],
      routes: [],
      route_gateway: '',
      route_metric: 0,
      redirect_gateway: false,
      redirect_gateway_flags: [],
      redirect_private: false,
      block_ipv6: false,
      ping_interval: '',
      ping_restart: '',
      ping_restart_disabled: false,
      renegotiate_interval: '',
      renegotiate_disabled: false,
      renegotiate_bytes: 0,
      renegotiate_packets: 0,
      tls_timeout: '',
      handshake_window: '',
      explicit_exit_notify: 0,
      udpNat: createUdpNat(),
      dialer: createDialer(),
    },
  }
}

export const createOpenVpnUser = (): OpenVpnUser => ({
  username: '',
  password: '',
})

export const createOpenVpnPushDnsServer = (): OpenVpnPushDnsServer => ({
  priority: 0,
  addresses: [],
  resolve_domains: [],
  dnssec: '' as OpenVpnDnsSec,
  transport: '' as OpenVpnDnsTransport,
  sni: '',
})

export const createOpenVpnServer = (): EndpointOpenVpnServer => {
  const type = Endpoint.OpenVpnServer
  return {
    ...createSwitchable(),
    type,
    tag: `${type}-ep`,
    config: {
      system: false,
      name: '',
      mtu: 0,
      mode: '' as OpenVpnMode,
      network: '' as OpenVpnNetwork,
      remote: '',
      remote_port: 0,
      max_clients: 0,
      address: [],
      peer_address: '',
      peer_address_ipv6: '',
      topology: '' as OpenVpnTopology,
      duplicate_cn: false,
      users: [],
      static_key: [],
      static_key_path: '',
      key_direction: '' as OpenVpnKeyDirection,
      tls: {
        certificate: [],
        certificate_path: '',
        key: [],
        key_path: '',
        client_certificate: [],
        client_certificate_path: '',
        verify_client_certificate: '' as OpenVpnVerifyClientCert,
        client_name: '',
        client_name_type: '' as OpenVpnCertNameType,
        peer_fingerprint: [],
        crl_path: '',
        remote_certificate_ku: [],
        remote_certificate_eku: '',
        remote_certificate_tls: '' as OpenVpnRemoteCertTls,
        certificate_profile: '' as OpenVpnCertProfile,
        ns_certificate_type: '' as OpenVpnNsCertType,
        version_min: '' as TlsVersion,
        version_max: '' as TlsVersion,
        cipher: '' as CipherSuites,
        groups: '',
        control_wrap: {
          type: '' as OpenVpnControlWrapType,
          key: [],
          key_path: '',
          direction: '' as OpenVpnKeyDirection,
          force_cookie: false,
        },
      },
      cipher: '',
      data_ciphers: [],
      data_ciphers_fallback: '',
      auth: '',
      mss_fix: 0,
      mss_fix_disabled: false,
      mss_fix_mode: '' as OpenVpnMssFixMode,
      replay_window: 0,
      replay_window_time: '',
      push: {
        routes: [],
        dns: [],
        dns_servers: [],
        search_domains: [],
        dhcp_options: [],
        redirect_gateway: false,
        redirect_gateway_flags: [],
        block_outside_dns: false,
        ping_interval: '',
        ping_restart: '',
      },
      ping_interval: '',
      ping_restart: '',
      renegotiate_interval: '',
      renegotiate_disabled: false,
      renegotiate_bytes: 0,
      renegotiate_packets: 0,
      handshake_window: '',
      listen: createListen(),
      udpNat: createUdpNat(),
    },
  }
}
