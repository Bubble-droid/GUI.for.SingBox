import {
  createWireGuardPeer,
  createEndpoint,
  createOpenConnectTnccCert,
  createOpenConnectFormEntry,
  createOpenVpnServerRemoteItem,
  createOpenVpnPullFilter,
  createOpenVpnPushDnsServer,
} from '@defaults/endpoints'
import { Endpoint } from '@features/constant/kernel'
import type { SingBoxEndpointOf, SingBoxEndpoint } from '@features/types/sing-box'
import { normalizeArray } from '@features/utils/helper'
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
import type { openconnect_tncc_certificate } from '@zhexin/typebox/endpoint'

import { sampleID } from '@/utils/others'

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
      allowed_ips: normalizeArray(allowed_ips),
      reserved: normalizeArray(reserved).map(String),
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
      address: normalizeArray(final.address),
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
      advertise_routes: normalizeArray(reset1.advertise_routes),
      advertise_tags:
        'advertise_tags' in reset1 ? normalizeArray(reset1.advertise_tags as string) : [],
      relay_server_static_endpoints: normalizeArray(reset1.relay_server_static_endpoints),
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

const restoreTnccCerts = (
  certificates: openconnect_tncc_certificate[] = [],
): OpenConnectTnccCertificate[] => {
  const template = createOpenConnectTnccCert()
  return normalizeArray(certificates).map((c) => ({
    ...template,
    ...c,
    certificate: 'certificate' in c ? normalizeArray(c.certificate) : [],
  }))
}

const restoreFormEntries = (
  formEntries: SingBoxEndpointOf<typeof Endpoint.OpenConnect>['form_entries'] = [],
): OpenConnectFormEntry[] => {
  const template = createOpenConnectFormEntry()
  return normalizeArray(formEntries).map((v) => ({
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

  const { tncc = {}, tls = {} } = final

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
        ...tncc,
        certificates: 'certificates' in tncc ? restoreTnccCerts(tncc.certificates) : [],
      },
      fortinet_host_check: { ...template.config.fortinet_host_check, ...final.fortinet_host_check },
      tls: {
        ...template.config.tls,
        ...tls,
        peer_fingerprint: normalizeArray(tls?.peer_fingerprint),
        certificate_authority:
          'certificate_authority' in tls ? normalizeArray(tls.certificate_authority) : [],
        client_certificate:
          'client_certificate' in tls ? normalizeArray(tls.client_certificate) : [],
        client_key: 'client_key' in tls ? normalizeArray(tls.client_key) : [],
        mca_certificate: 'mca_certificate' in tls ? normalizeArray(tls.mca_certificate) : [],
        mca_key: 'mca_key' in tls ? normalizeArray(tls.mca_key) : [],
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
  const { type, tag, ...rest } = openvpn
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.OpenVpnClient)
  const { dialer, rest: reset1 } = restoreDialer(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  const servers = createOpenVpnServerRemoteItem()
  const pullFilter = createOpenVpnPullFilter()

  const tls = final.tls ?? {}

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      servers:
        'servers' in final
          ? (final.servers as Recordable[]).map((v) => ({
              ...servers,
              ...v,
            }))
          : [],
      address: normalizeArray(final.address),
      static_key: normalizeArray(final.static_key),
      data_ciphers: normalizeArray(final.data_ciphers),
      routes: normalizeArray(final.routes),
      redirect_gateway_flags: normalizeArray(final.redirect_gateway_flags),
      pull_filters:
        final.pull_filters?.map((v) => ({
          ...pullFilter,
          ...v,
        })) ?? [],
      tls: {
        ...template.config.tls,
        ...tls,
        certificate: 'certificate' in tls ? normalizeArray(tls.certificate) : [],
        client_certificate:
          'client_certificate' in tls ? normalizeArray(tls.client_certificate) : [],
        client_key: 'client_key' in tls ? normalizeArray(tls.client_key) : [],
        peer_fingerprint: normalizeArray(final.tls.peer_fingerprint),
        remote_certificate_ku: normalizeArray(final.tls.remote_certificate_ku),
        control_wrap: {
          ...template.config.tls.control_wrap,
          ...tls.control_wrap,
          key:
            tls.control_wrap && 'key' in tls.control_wrap
              ? normalizeArray(tls.control_wrap.key)
              : [],
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
  const { type, tag, ...rest } = openvpn
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(Endpoint.OpenVpnServer)
  const { listen, rest: reset1 } = restoreListen(rest, maps)
  const { udpNat, rest: final } = restoreUdpNat(reset1)

  const { tls, push = {} } = final

  const pushDnsServer = createOpenVpnPushDnsServer()

  return {
    ...template,
    ...base,
    config: {
      ...template.config,
      ...final,
      address: normalizeArray(final.address),
      users: normalizeArray(final.users),
      static_key: normalizeArray(final.static_key),
      data_ciphers: normalizeArray(final.data_ciphers),
      tls: {
        ...template.config.tls,
        ...tls,
        certificate: 'certificate' in tls ? normalizeArray(tls.certificate) : [],
        key: 'key' in tls ? normalizeArray(tls.key) : [],
        client_certificate:
          'client_certificate' in tls ? normalizeArray(tls.client_certificate) : [],
        peer_fingerprint: normalizeArray(tls.peer_fingerprint),
        remote_certificate_ku: normalizeArray(tls.remote_certificate_ku),
        control_wrap: {
          ...template.config.tls.control_wrap,
          ...tls?.control_wrap,
          key:
            tls.control_wrap && 'key' in tls.control_wrap
              ? normalizeArray(tls.control_wrap.key)
              : [],
        },
      },
      push: {
        ...template.config.push,
        ...push,
        routes: normalizeArray(push.routes),
        dns: normalizeArray(push.dns),
        dns_servers:
          push.dns_servers?.map((d) => ({
            ...pushDnsServer,
            ...d,
            addresses: normalizeArray(d.addresses),
            resolve_domains: normalizeArray(d.resolve_domains),
          })) ?? [],
        search_domains: normalizeArray(push.search_domains),
        dhcp_options: normalizeArray(push.dhcp_options),
        redirect_gateway_flags: normalizeArray(push.redirect_gateway_flags),
      },
      listen,
      udpNat,
    },
  }
}
