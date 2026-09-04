import { EndpointType } from '@profile/constant/kernel'
import {
  createWireGuardPeer,
  createOpenConnectTnccCert,
  createOpenConnectFormEntry,
  createOpenVpnServerRemoteItem,
  createOpenVpnPullFilter,
  createOpenVpnPushDnsServer,
  createEndpoint,
} from '@profile/defaults/endpoints'
import type {
  EndpointItem,
  OpenConnectEndpoint,
  OpenConnectFormEntry,
  OpenConnectTnccCertificate,
  OpenVpnClientEndpoint,
  OpenVpnServerEndpoint,
  TailscaleEndpoint,
  WireGuardEndpoint,
  WireGuardPeer,
} from '@profile/types/profiles/endpoints'
import type { Endpoint, EndpointOf } from '@profile/types/sing-box/config'
import { normalizeArray } from '@profile/utils/helper'
import type { openconnect_tncc_certificate } from '@zhexin/typebox/endpoint'

import { sampleID } from '@/utils/others'

import type { Recordable } from '@/types/typescript'

import { restoreDialer, restoreUdpNat, restoreListen } from './shared'
import type { IdMaps } from './types'

const restorePeers = (peers: EndpointOf<'wireguard'>['peers'] = []): WireGuardPeer[] => {
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

const restoreWireGuard = (
  wireguard: EndpointOf<typeof EndpointType.WireGuard>,
  maps: IdMaps,
): WireGuardEndpoint => {
  const { type, tag, ...rest } = wireguard
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(EndpointType.WireGuard)
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

const restoreTailscale = (
  tailscale: EndpointOf<typeof EndpointType.Tailscale>,
  maps: IdMaps,
): TailscaleEndpoint => {
  const { type, tag, ...rest } = tailscale
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(EndpointType.Tailscale)
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

const restoreSshServer = (
  sshServer: EndpointOf<typeof EndpointType.Tailscale>['ssh_server'],
  config: TailscaleEndpoint['config'],
): TailscaleEndpoint['config']['ssh_server'] => {
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
  formEntries: EndpointOf<typeof EndpointType.OpenConnect>['form_entries'] = [],
): OpenConnectFormEntry[] => {
  const template = createOpenConnectFormEntry()
  return normalizeArray(formEntries).map((v) => ({
    ...template,
    ...v,
  }))
}

const restoreOpenConnect = (
  openconnect: EndpointOf<typeof EndpointType.OpenConnect>,
  maps: IdMaps,
): OpenConnectEndpoint => {
  const { type, tag, ...rest } = openconnect
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(EndpointType.OpenConnect)
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

const restoreOpenVpnClient = (
  openvpn: EndpointOf<typeof EndpointType.OpenVpnClient>,
  maps: IdMaps,
): OpenVpnClientEndpoint => {
  const { type, tag, ...rest } = openvpn
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(EndpointType.OpenVpnClient)
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
    } as OpenVpnClientEndpoint['config'],
  }
}

const restoreOpenVpnServer = (
  openvpn: EndpointOf<typeof EndpointType.OpenVpnServer>,
  maps: IdMaps,
): OpenVpnServerEndpoint => {
  const { type, tag, ...rest } = openvpn
  const id = maps.endpoints.get(tag) ?? sampleID()
  const base = {
    id,
    tag,
    type,
  }
  const template = createEndpoint(EndpointType.OpenVpnServer)
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

export const restoreEndpoints = (maps: IdMaps, endpoints: Endpoint[] = []): EndpointItem[] =>
  endpoints.flatMap((raw): EndpointItem[] => {
    switch (raw.type) {
      case EndpointType.WireGuard: {
        return [restoreWireGuard(raw, maps)]
      }
      case EndpointType.Tailscale: {
        return [restoreTailscale(raw, maps)]
      }
      case EndpointType.OpenConnect: {
        return [restoreOpenConnect(raw, maps)]
      }
      case EndpointType.OpenVpnClient: {
        return [restoreOpenVpnClient(raw, maps)]
      }
      case EndpointType.OpenVpnServer: {
        return [restoreOpenVpnServer(raw, maps)]
      }
      default: {
        return []
      }
    }
  })
