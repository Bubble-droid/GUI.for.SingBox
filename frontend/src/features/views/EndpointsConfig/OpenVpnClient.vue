<script lang="ts" setup>
import { createOpenVpnServerRemoteItem, createOpenVpnPullFilter } from '@defaults/endpoints'
import {
  OpenVpnModeOptions,
  OpenVpnTopologyOptions,
  OpenVpnAuthRetryOptions,
  OpenVpnKeyDirectionOptions,
  OpenVpnCertNameTypeOptions,
  OpenVpnRemoteCertTlsOptions,
  OpenVpnCertProfileOptions,
  OpenVpnNsCertTypeOptions,
  OpenVpnControlWrapTypeOptions,
  OpenVpnMssFixModeOptions,
  OpenVpnCompressionOptions,
  OpenVpnCompressionLzoOptions,
  OpenVpnAllowCompressionOptions,
  OpenVpnPullFilterActionOptions,
  TlsVersionOptions,
  TlsCipherSuiteOptions,
  NetworkOptions,
} from '@features/constant/options'
import type { EndpointOpenVpnClient } from '@profiles/endpoints'
import PortInput from '@views/Shared/PortInput.vue'
import { useI18n } from 'vue-i18n'

const model = defineModel<EndpointOpenVpnClient['config']>({ required: true })
const { t } = useI18n()

const addRemoteServer = () => {
  model.value.servers.push(createOpenVpnServerRemoteItem())
}

const deleteRemoteServer = (index: number) => {
  model.value.servers.splice(index, 1)
}

const addPullFilter = () => {
  model.value.pull_filters.push(createOpenVpnPullFilter())
}

const deletePullFilter = (index: number) => {
  model.value.pull_filters.splice(index, 1)
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
    {{ t('kernel.endpoints.openvpn.server') }}
    <Input v-model="model.server" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.server_port') }}
    <PortInput v-model="model.server_port" editable />
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.servers.title') }}
    <Button icon="add" type="primary" @click="addRemoteServer">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.servers.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(item, index) in model.servers" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deleteRemoteServer(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.servers.server') }}
        <Input v-model="item.server" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.servers.server_port') }}
        <PortInput v-model="item.server_port" editable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.servers.network') }}
        <Select v-model="item.network" :options="NetworkOptions" clearable />
      </div>
    </Card>
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.remote_random') }}
    <Switch v-model="model.remote_random" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.network.title') }}
    <Select v-model="model.network" :options="NetworkOptions" clearable />
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
    {{ t('kernel.endpoints.openvpn.username') }}
    <Input v-model="model.username" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.password') }}
    <Input v-model="model.password" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.auth_retry.title') }}
    <Select v-model="model.auth_retry" :options="OpenVpnAuthRetryOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.static_challenge') }}
    <Input v-model="model.static_challenge" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.static_challenge_echo') }}
    <Switch v-model="model.static_challenge_echo" />
  </div>
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
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.server_name') }}
    <Input v-model="model.tls.server_name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.cert_name_type.title') }}
    <Select v-model="model.tls.server_name_type" :options="OpenVpnCertNameTypeOptions" clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.certificate.length }">
    {{ t('kernel.endpoints.openvpn.tls.certificate') }}
    <InputList v-model="model.tls.certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.certificate_path') }}
    <Input v-model="model.tls.certificate_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.client_certificate.length }">
    {{ t('kernel.endpoints.openvpn.tls.client_certificate') }}
    <InputList v-model="model.tls.client_certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.client_certificate_path') }}
    <Input v-model="model.tls.client_certificate_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.client_key.length }">
    {{ t('kernel.endpoints.openvpn.tls.client_key') }}
    <InputList v-model="model.tls.client_key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.tls.client_key_path') }}
    <Input v-model="model.tls.client_key_path" editable clearable />
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
    {{ t('kernel.endpoints.openvpn.fragment') }}
    <Input v-model="model.fragment" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.replay_window') }}
    <Input v-model="model.replay_window" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.replay_window_time') }}
    <Input v-model="model.replay_window_time" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.compression.title') }}
    <Select v-model="model.compression" :options="OpenVpnCompressionOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.compression_lzo.title') }}
    <Select v-model="model.compression_lzo" :options="OpenVpnCompressionLzoOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.allow_compression.title') }}
    <Select v-model="model.allow_compression" :options="OpenVpnAllowCompressionOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.route_no_pull') }}
    <Switch v-model="model.route_no_pull" />
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.pull_filters.title') }}
    <Button icon="add" type="primary" @click="addPullFilter">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.pull_filters.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(filter, index) in model.pull_filters" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deletePullFilter(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.pull_filters.action.title') }}
        <Select v-model="filter.action" :options="OpenVpnPullFilterActionOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openvpn.pull_filters.text') }}
        <Input v-model="filter.text" editable clearable />
      </div>
    </Card>
  </div>

  <Divider />
  <div class="form-item" :class="{ 'items-start': !!model.routes.length }">
    {{ t('kernel.endpoints.openvpn.routes') }}
    <InputList v-model="model.routes" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.route_gateway') }}
    <Input v-model="model.route_gateway" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.route_metric') }}
    <Input v-model="model.route_metric" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.redirect_gateway') }}
    <Switch v-model="model.redirect_gateway" />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.redirect_gateway_flags.length }">
    {{ t('kernel.endpoints.openvpn.redirect_gateway_flags') }}
    <InputList v-model="model.redirect_gateway_flags" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.redirect_private') }}
    <Switch v-model="model.redirect_private" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.block_ipv6') }}
    <Switch v-model="model.block_ipv6" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ping_interval') }}
    <Input v-model="model.ping_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ping_restart') }}
    <Input v-model="model.ping_restart" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.ping_restart_disabled') }}
    <Switch v-model="model.ping_restart_disabled" />
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
    {{ t('kernel.endpoints.openvpn.tls_timeout') }}
    <Input v-model="model.tls_timeout" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.handshake_window') }}
    <Input v-model="model.handshake_window" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openvpn.explicit_exit_notify') }}
    <Input v-model="model.explicit_exit_notify" type="number" editable clearable />
  </div>
</template>
