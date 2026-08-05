<script lang="ts" setup>
import { createOpenVpnUser, createOpenVpnPushDnsServer } from '@defaults/endpoints'
import {
  OpenVpnModeOptions,
  OpenVpnNetworkOptions,
  OpenVpnTopologyOptions,
  OpenVpnKeyDirectionOptions,
  OpenVpnVerifyClientCertOptions,
  OpenVpnCertNameTypeOptions,
  OpenVpnRemoteCertTlsOptions,
  OpenVpnCertProfileOptions,
  OpenVpnNsCertTypeOptions,
  OpenVpnControlWrapTypeOptions,
  OpenVpnMssFixModeOptions,
  OpenVpnDnsSecOptions,
  OpenVpnDnsTransportOptions,
  TlsVersionOptions,
  TlsCipherSuiteOptions,
} from '@features/constant/options'
import type { EndpointOpenVpnServer } from '@profiles/endpoints'
import PortInput from '@views/Shared/PortInput.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<EndpointOpenVpnServer['config']>({ required: true })
const { t } = useI18n()

const addUser = () => {
  model.value.users.push(createOpenVpnUser())
}

const deleteUser = (index: number) => {
  model.value.users.splice(index, 1)
}

const addPushDnsServer = () => {
  model.value.push.dns_servers.push(createOpenVpnPushDnsServer())
}

const deletePushDnsServer = (index: number) => {
  model.value.push.dns_servers.splice(index, 1)
}
</script>

<template>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.system') }}
    <Switch v-model="model.system" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.name') }}
    <Input v-model="model.name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.mtu') }}
    <Input v-model="model.mtu" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.mode.title') }}
    <Select v-model="model.mode" :options="OpenVpnModeOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.network.title') }}
    <Select v-model="model.network" :options="OpenVpnNetworkOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.remote') }}
    <Input v-model="model.remote" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.remote_port') }}
    <PortInput v-model="model.remote_port" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.max_clients') }}
    <Input v-model="model.max_clients" type="number" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.address.length }">
    {{ t('kernel.endpoints.openvpn.address') }}
    <InputList v-model="model.address" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.peer_address') }}
    <Input v-model="model.peer_address" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.peer_address_ipv6') }}
    <Input v-model="model.peer_address_ipv6" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.topology.title') }}
    <Select v-model="model.topology" :options="OpenVpnTopologyOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.duplicate_cn') }}
    <Switch v-model="model.duplicate_cn" />
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.users.title') }}
    <Button icon="add" type="primary" @click="addUser">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.users.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(user, index) in model.users" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deleteUser(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.users.username') }}
        <Input v-model="user.username" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.users.password') }}
        <Input v-model="user.password" clearable />
      </div>
    </Card>
  </div>

  <Divider />
  <div class="form-item" :class="{ 'items-start': !!model.static_key.length }">
    {{ t('kernel.endpoints.openvpn.static_key') }}
    <InputList v-model="model.static_key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.static_key_path') }}
    <Input v-model="model.static_key_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.key_direction.title') }}
    <Select v-model="model.key_direction" :options="OpenVpnKeyDirectionOptions" clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openvpn.tls.title') }}</Divider>
  <div class="form-item" :class="{ 'items-start': !!model.tls.certificate.length }">
    {{ t('kernel.endpoints.openvpn.tls.certificate') }}
    <InputList v-model="model.tls.certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.certificate_path') }}
    <Input v-model="model.tls.certificate_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.key.length }">
    {{ t('kernel.endpoints.openvpn.tls.key') }}
    <InputList v-model="model.tls.key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.key_path') }}
    <Input v-model="model.tls.key_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.client_certificate.length }">
    {{ t('kernel.endpoints.openvpn.tls.client_certificate') }}
    <InputList v-model="model.tls.client_certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.client_certificate_path') }}
    <Input v-model="model.tls.client_certificate_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.verify_client_cert.title') }}
    <Select
      v-model="model.tls.verify_client_certificate"
      :options="OpenVpnVerifyClientCertOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.server_name') }}
    <Input v-model="model.tls.client_name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.cert_name_type.title') }}
    <Select v-model="model.tls.client_name_type" :options="OpenVpnCertNameTypeOptions" clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.peer_fingerprint.length }">
    {{ t('kernel.endpoints.openvpn.tls.peer_fingerprint') }}
    <InputList v-model="model.tls.peer_fingerprint" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.crl_path') }}
    <Input v-model="model.tls.crl_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.remote_certificate_ku.length }">
    {{ t('kernel.endpoints.openvpn.tls.remote_certificate_ku') }}
    <InputList v-model="model.tls.remote_certificate_ku" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.remote_certificate_eku') }}
    <Input v-model="model.tls.remote_certificate_eku" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.remote_cert_tls.title') }}
    <Select
      v-model="model.tls.remote_certificate_tls"
      :options="OpenVpnRemoteCertTlsOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.cert_profile.title') }}
    <Select
      v-model="model.tls.certificate_profile"
      :options="OpenVpnCertProfileOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ns_cert_type.title') }}
    <Select v-model="model.tls.ns_certificate_type" :options="OpenVpnNsCertTypeOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.version_min') }}
    <Select v-model="model.tls.version_min" :options="TlsVersionOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.version_max') }}
    <Select v-model="model.tls.version_max" :options="TlsVersionOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.cipher') }}
    <Select v-model="model.tls.cipher" :options="TlsCipherSuiteOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.groups') }}
    <Input v-model="model.tls.groups" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openvpn.tls.control_wrap.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.control_wrap_type.title') }}
    <Select
      v-model="model.tls.control_wrap.type"
      :options="OpenVpnControlWrapTypeOptions"
      clearable
    />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.control_wrap.key.length }">
    {{ t('kernel.endpoints.openvpn.static_key') }}
    <InputList v-model="model.tls.control_wrap.key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.static_key_path') }}
    <Input v-model="model.tls.control_wrap.key_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.key_direction.title') }}
    <Select
      v-model="model.tls.control_wrap.direction"
      :options="OpenVpnKeyDirectionOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.control_wrap.force_cookie') }}
    <Switch v-model="model.tls.control_wrap.force_cookie" />
  </div>

  <Divider />
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.cipher') }}
    <Input v-model="model.cipher" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.data_ciphers.length }">
    {{ t('kernel.endpoints.openvpn.data_ciphers') }}
    <InputList v-model="model.data_ciphers" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.data_ciphers_fallback') }}
    <Input v-model="model.data_ciphers_fallback" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.auth') }}
    <Input v-model="model.auth" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.mss_fix') }}
    <Input v-model="model.mss_fix" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.mss_fix_disabled') }}
    <Switch v-model="model.mss_fix_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.mss_fix_mode.title') }}
    <Select v-model="model.mss_fix_mode" :options="OpenVpnMssFixModeOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.replay_window') }}
    <Input v-model="model.replay_window" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.replay_window_time') }}
    <Input v-model="model.replay_window_time" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openvpn.push.title') }}</Divider>
  <div class="form-item" :class="{ 'items-start': !!model.push.routes.length }">
    {{ t('kernel.endpoints.openvpn.push.routes') }}
    <InputList v-model="model.push.routes" />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.push.dns.length }">
    {{ t('kernel.endpoints.openvpn.push.dns') }}
    <InputList v-model="model.push.dns" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.push.dns_servers.title') }}
    <Button icon="add" type="primary" @click="addPushDnsServer">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.push.dns_servers.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(dnsServer, index) in model.push.dns_servers" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deletePushDnsServer(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.priority') }}
        <Input v-model="dnsServer.priority" type="number" editable clearable />
      </div>
      <div class="form-item" :class="{ 'items-start': !!dnsServer.addresses.length }">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.addresses') }}
        <InputList v-model="dnsServer.addresses" />
      </div>
      <div class="form-item" :class="{ 'items-start': !!dnsServer.resolve_domains.length }">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.resolve_domains') }}
        <InputList v-model="dnsServer.resolve_domains" />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.dnssec.title') }}
        <Select v-model="dnsServer.dnssec" :options="OpenVpnDnsSecOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.transport.title') }}
        <Select v-model="dnsServer.transport" :options="OpenVpnDnsTransportOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.push.dns_servers.sni') }}
        <Input v-model="dnsServer.sni" editable clearable />
      </div>
    </Card>
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.push.search_domains.length }">
    {{ t('kernel.endpoints.openvpn.push.search_domains') }}
    <InputList v-model="model.push.search_domains" />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.push.dhcp_options.length }">
    {{ t('kernel.endpoints.openvpn.push.dhcp_options') }}
    <InputList v-model="model.push.dhcp_options" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.push.redirect_gateway') }}
    <Switch v-model="model.push.redirect_gateway" />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.push.redirect_gateway_flags.length }">
    {{ t('kernel.endpoints.openvpn.push.redirect_gateway_flags') }}
    <InputList v-model="model.push.redirect_gateway_flags" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.push.block_outside_dns') }}
    <Switch v-model="model.push.block_outside_dns" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.push.ping_interval') }}
    <Input v-model="model.push.ping_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.push.ping_restart') }}
    <Input v-model="model.push.ping_restart" editable clearable />
  </div>

  <Divider />
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ping_interval') }}
    <Input v-model="model.ping_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ping_restart') }}
    <Input v-model="model.ping_restart" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.renegotiate_interval') }}
    <Input v-model="model.renegotiate_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.renegotiate_disabled') }}
    <Switch v-model="model.renegotiate_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.renegotiate_bytes') }}
    <Input v-model="model.renegotiate_bytes" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.renegotiate_packets') }}
    <Input v-model="model.renegotiate_packets" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.handshake_window') }}
    <Input v-model="model.handshake_window" editable clearable />
  </div>
</template>
