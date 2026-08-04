import {
  createWireGuardPeer,
  createEndpoint,
  createOpenConnectTnccCert,
  createOpenConnectFormEntry,
} from '@defaults/endpoints'
import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { ensureArray } from '@features/utils/helper'
import type {
  WireGuardPeer,
  EndpointWireGuard,
  EndpointConfig,
  EndpointTailscale,
  EndpointOpenConnect,
  EndpointOpenVpnClient,
  EndpointOpenVpnServer,
  OpenConnectTnccCertificate,
  OpenConnectFormEntry,
} from '@profiles/endpoints'

import { sampleID } from '@/utils'

import { restoreDialer, restoreUdpNat, restoreListen } from './shared'
import type { IdMaps } from './types'

export const restoreEndpoints = (
  endpoints: SingBoxEndpoint[] = [],
  maps: IdMaps,
): EndpointConfig[] => {
  return endpoints.flatMap((raw): EndpointConfig[] => {
    switch (raw.type) {
      case Endpoint.WireGuard:
        return [restoreWireGuard(raw, maps)]
      case Endpoint.Tailscale:
        return [restoreTailscale(raw, maps)]
      case Endpoint.OpenConnect:
        return [restoreOpenConnect(raw, maps)]
      case Endpoint.OpenVpnClient:
        return [restoreOpenVpnClient(raw, maps)]
      case Endpoint.OpenVpnServer:
        return [restoreOpenVpnServer(raw, maps)]
      default:
        return []
    }
  })
}

const restorePeers = (
  peers: SingBoxEndpointOf<typeof Endpoint.WireGuard>['peers'] = [],
): WireGuardPeer[] => {
  const peer = createWireGuardPeer()
  return peers.map((p) => {
    const { allowed_ips, reserved, ...rest } = p
    return {
      ...peer,
      ...rest,
      allowed_ips: ensureArray(allowed_ips),
      reserved: ensureArray(reserved).map(String),
    }
  })
}

export const restoreWireGuard = (
  wireguard: SingBoxEndpointOf<typeof Endpoint.WireGuard>,
  maps: IdMaps,
): EndpointWireGuard => {
  const { type, tag, ...rest } = wireguard
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.WireGuard)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      address: ensureArray(final.address),
      peers: restorePeers(final.peers),
      dialer,
      udpNat,
    },
  }
}

export const restoreTailscale = (
  tailscale: SingBoxEndpointOf<typeof Endpoint.Tailscale>,
  maps: IdMaps,
): EndpointTailscale => {
  const { type, tag, ...rest } = tailscale
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.Tailscale)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...reset1,
      advertise_routes: ensureArray(reset1.advertise_routes),
      advertise_tags: ensureArray((reset1 as any).advertise_tags),
      relay_server_static_endpoints: ensureArray(reset1.relay_server_static_endpoints),
      ssh_server: restoreSshServer(reset1.ssh_server, template.config),
      dialer,
    },
  }
}

export const restoreSshServer = (
  sshServer: SingBoxEndpointOf<typeof Endpoint.Tailscale>['ssh_server'],
  config: EndpointTailscale['config'],
): EndpointTailscale['config']['ssh_server'] => {
  if (typeof sshServer === 'boolean') {
    return { ...config.ssh_server, enabled: sshServer }
  }
  return { ...config.ssh_server, ...sshServer }
}

const restoreTnccCerts = (certificates: any[] = []): OpenConnectTnccCertificate[] => {
  const template = createOpenConnectTnccCert()
  return ensureArray(certificates).map((c) => ({
    ...template,
    ...c,
    certificate: ensureArray(c.certificate),
  }))
}

const restoreFormEntries = (
  formEntries: SingBoxEndpointOf<typeof Endpoint.OpenConnect>['form_entries'] = [],
): OpenConnectFormEntry[] => {
  const template = createOpenConnectFormEntry()
  return ensureArray(formEntries).map((v) => ({
    ...template,
    ...v,
  }))
}

export const restoreOpenConnect = (
  openconnect: SingBoxEndpointOf<typeof Endpoint.OpenConnect>,
  maps: IdMaps,
): EndpointOpenConnect => {
  const { type, tag, ...rest } = openconnect
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.OpenConnect)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      token: { ...template.config.token, ...final.token },
      mobile: { ...template.config.mobile, ...final.mobile },
      csd: { ...template.config.csd, ...final.csd },
      hip: { ...template.config.hip, ...final.hip },
      tncc: {
        ...template.config.tncc,
        ...final.tncc,
        certificates: restoreTnccCerts((final.tncc as any)?.certificates),
      },
      fortinet_host_check: { ...template.config.fortinet_host_check, ...final.fortinet_host_check },
      tls: {
        ...template.config.tls,
        ...final.tls,
        peer_fingerprint: ensureArray(final.tls?.peer_fingerprint),
        certificate_authority: ensureArray((final.tls as any)?.certificate_authority),
        client_certificate: ensureArray((final.tls as any)?.client_certificate),
        client_key: ensureArray((final.tls as any)?.client_key),
        mca_certificate: ensureArray((final.tls as any)?.mca_certificate),
        mca_key: ensureArray((final.tls as any)?.mca_key),
      },
      form_entries: restoreFormEntries(final.form_entries),
      dialer,
      udpNat,
    },
  }
}

export const restoreOpenVpnClient = (
  openvpn: SingBoxEndpointOf<typeof Endpoint.OpenVpnClient>,
  maps: IdMaps,
): EndpointOpenVpnClient => {
  const { type, tag, ...rest } = openvpn as any
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.OpenVpnClient)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      servers: ensureArray(final.servers),
      address: ensureArray(final.address),
      static_key: ensureArray(final.static_key),
      data_ciphers: ensureArray(final.data_ciphers),
      routes: ensureArray(final.routes),
      redirect_gateway_flags: ensureArray(final.redirect_gateway_flags),
      pull_filters: ensureArray(final.pull_filters),
      tls: {
        ...template.config.tls,
        ...final.tls,
        certificate: ensureArray(final.tls?.certificate),
        client_certificate: ensureArray(final.tls?.client_certificate),
        client_key: ensureArray(final.tls?.client_key),
        peer_fingerprint: ensureArray(final.tls?.peer_fingerprint),
        remote_certificate_ku: ensureArray(final.tls?.remote_certificate_ku),
        control_wrap: {
          ...template.config.tls.control_wrap,
          ...final.tls?.control_wrap,
          key: ensureArray(final.tls?.control_wrap?.key),
        },
      },
      dialer,
      udpNat,
    },
  }
}

export const restoreOpenVpnServer = (
  openvpn: SingBoxEndpointOf<typeof Endpoint.OpenVpnServer>,
  maps: IdMaps,
): EndpointOpenVpnServer => {
  const { type, tag, ...rest } = openvpn as any
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.OpenVpnServer)
  const { listen, rest: reset1 } = restoreListen(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      address: ensureArray(final.address),
      users: ensureArray(final.users),
      static_key: ensureArray(final.static_key),
      data_ciphers: ensureArray(final.data_ciphers),
      tls: {
        ...template.config.tls,
        ...final.tls,
        certificate: ensureArray(final.tls?.certificate),
        key: ensureArray(final.tls?.key),
        client_certificate: ensureArray(final.tls?.client_certificate),
        peer_fingerprint: ensureArray(final.tls?.peer_fingerprint),
        remote_certificate_ku: ensureArray(final.tls?.remote_certificate_ku),
        control_wrap: {
          ...template.config.tls.control_wrap,
          ...final.tls?.control_wrap,
          key: ensureArray(final.tls?.control_wrap?.key),
        },
      },
      push: {
        ...template.config.push,
        ...final.push,
        routes: ensureArray(final.push?.routes),
        dns: ensureArray(final.push?.dns),
        dns_servers: ensureArray(final.push?.dns_servers).map((d) => ({
          ...d,
          addresses: ensureArray(d?.addresses),
          resolve_domains: ensureArray(d?.resolve_domains),
        })),
        search_domains: ensureArray(final.push?.search_domains),
        dhcp_options: ensureArray(final.push?.dhcp_options),
        redirect_gateway_flags: ensureArray(final.push?.redirect_gateway_flags),
      },
      listen,
      udpNat,
    },
  }
}
