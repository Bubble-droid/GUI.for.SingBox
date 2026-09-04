<script lang="ts" setup>
import PortInput from '@profile/components/Shared/PortInput.vue'
import {
  OpenConnectFlavorOptions,
  OpenConnectTokenModeOptions,
  OpenConnectReportedOsOptions,
  OpenConnectCompressionModeOptions,
} from '@profile/constant/options'
import { createOpenConnectFormEntry, createOpenConnectTnccCert } from '@profile/defaults/endpoint'
import type { OpenConnectEndpoint } from '@profile/types/profiles/endpoint'
import { useI18n } from 'vue-i18n'

const model = defineModel<OpenConnectEndpoint['config']>({ required: true })
const { t } = useI18n()

const addTnccCert = () => {
  model.value.tncc.certificates.push(createOpenConnectTnccCert())
}

const deleteTnccCert = (index: number) => {
  model.value.tncc.certificates.splice(index, 1)
}

const addFormEntry = () => {
  model.value.form_entries.push(createOpenConnectFormEntry())
}

const deleteFormEntry = (index: number) => {
  model.value.form_entries.splice(index, 1)
}
</script>

<template>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.system') }}
    <Switch v-model="model.system" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.name') }}
    <Input v-model="model.name" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.server') }}
    <Input v-model="model.server" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.flavor.title') }}
    <Select v-model="model.flavor" :options="OpenConnectFlavorOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.username') }}
    <Input v-model="model.username" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.password') }}
    <Input v-model="model.password" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.auth_group') }}
    <Input v-model="model.auth_group" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.cookie') }}
    <Input v-model="model.cookie" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.token.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.mode.title') }}
    <Select v-model="model.token.mode" :options="OpenConnectTokenModeOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.secret') }}
    <Input v-model="model.token.secret" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.secret_path') }}
    <Input v-model="model.token.secret_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.pin') }}
    <Input v-model="model.token.pin" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.password') }}
    <Input v-model="model.token.password" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.device_id') }}
    <Input v-model="model.token.device_id" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.token.counter') }}
    <Input v-model="model.token.counter" type="number" editable clearable />
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.reported_os.title') }}
    <Select v-model="model.reported_os" :options="OpenConnectReportedOsOptions" clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.user_agent') }}
    <Input v-model="model.user_agent" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.version') }}
    <Input v-model="model.version" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.local_hostname') }}
    <Input v-model="model.local_hostname" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.mobile.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.mobile.platform_version') }}
    <Input v-model="model.mobile.platform_version" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.mobile.device_type') }}
    <Input v-model="model.mobile.device_type" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.mobile.device_unique_id') }}
    <Input v-model="model.mobile.device_unique_id" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.csd.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.csd.wrapper_path') }}
    <Input v-model="model.csd.wrapper_path" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.hip.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.hip.wrapper_path') }}
    <Input v-model="model.hip.wrapper_path" editable clearable />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.tncc.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tncc.wrapper_path') }}
    <Input v-model="model.tncc.wrapper_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tncc.device_id') }}
    <Input v-model="model.tncc.device_id" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tncc.user_agent') }}
    <Input v-model="model.tncc.user_agent" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tncc.machine_identification_enabled') }}
    <Switch v-model="model.tncc.machine_identification_enabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tncc.certificates.title') }}
    <Button icon="add" type="primary" @click="addTnccCert">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.tncc.certificates.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(cert, index) in model.tncc.certificates" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deleteTnccCert(index)" />
      </template>
      <div class="form-item" :class="{ 'items-start': !!cert.certificate.length }">
        {{ t('kernel.endpoints.openconnect.tncc.certificates.certificate') }}
        <InputList v-model="cert.certificate" />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.tncc.certificates.certificate_path') }}
        <Input v-model="cert.certificate_path" editable clearable />
      </div>
    </Card>
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.fortinet_host_check.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.fortinet_host_check.hostcheck') }}
    <Input v-model="model.fortinet_host_check.hostcheck" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.fortinet_host_check.check_virtual_desktop') }}
    <Input v-model="model.fortinet_host_check.check_virtual_desktop" editable clearable />
  </div>

  <Divider />
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.no_udp') }}
    <Switch v-model="model.no_udp" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.dtls_local_port') }}
    <PortInput v-model="model.dtls_local_port" editable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.compression_disabled') }}
    <Switch v-model="model.compression_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.compression_mode.title') }}
    <Select
      v-model="model.compression_mode"
      :options="OpenConnectCompressionModeOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.ipv6_disabled') }}
    <Switch v-model="model.ipv6_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.http_keepalive_disabled') }}
    <Switch v-model="model.http_keepalive_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.xml_post_disabled') }}
    <Switch v-model="model.xml_post_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.external_auth_disabled') }}
    <Switch v-model="model.external_auth_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.password_authentication_disabled') }}
    <Switch v-model="model.password_authentication_disabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tcp_keep_alive_enabled') }}
    <Switch v-model="model.tcp_keep_alive_enabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.pfs') }}
    <Switch v-model="model.pfs" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.mtu') }}
    <Input v-model="model.mtu" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.base_mtu') }}
    <Input v-model="model.base_mtu" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.dpd_interval') }}
    <Input v-model="model.dpd_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.reconnect_timeout') }}
    <Input v-model="model.reconnect_timeout" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.trojan_interval') }}
    <Input v-model="model.trojan_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.queue_length') }}
    <Input v-model="model.queue_length" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.allow_insecure_crypto') }}
    <Switch v-model="model.allow_insecure_crypto" />
  </div>

  <Divider>{{ t('kernel.endpoints.openconnect.tls.title') }}</Divider>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.insecure') }}
    <Switch v-model="model.tls.insecure" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.server_name') }}
    <Input v-model="model.tls.server_name" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.peer_fingerprint.length }">
    {{ t('kernel.endpoints.openconnect.tls.peer_fingerprint') }}
    <InputList v-model="model.tls.peer_fingerprint" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.system_trust_disabled') }}
    <Switch v-model="model.tls.system_trust_disabled" />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.certificate_authority.length }">
    {{ t('kernel.endpoints.openconnect.tls.certificate_authority') }}
    <InputList v-model="model.tls.certificate_authority" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.certificate_authority_path') }}
    <Input v-model="model.tls.certificate_authority_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.client_certificate.length }">
    {{ t('kernel.endpoints.openconnect.tls.client_certificate') }}
    <InputList v-model="model.tls.client_certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.client_certificate_path') }}
    <Input v-model="model.tls.client_certificate_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.client_key.length }">
    {{ t('kernel.endpoints.openconnect.tls.client_key') }}
    <InputList v-model="model.tls.client_key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.client_key_path') }}
    <Input v-model="model.tls.client_key_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.client_key_password') }}
    <Input v-model="model.tls.client_key_password" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.mca_certificate.length }">
    {{ t('kernel.endpoints.openconnect.tls.mca_certificate') }}
    <InputList v-model="model.tls.mca_certificate" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.mca_certificate_path') }}
    <Input v-model="model.tls.mca_certificate_path" editable clearable />
  </div>
  <div class="form-item" :class="{ 'items-start': !!model.tls.mca_key.length }">
    {{ t('kernel.endpoints.openconnect.tls.mca_key') }}
    <InputList v-model="model.tls.mca_key" />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.mca_key_path') }}
    <Input v-model="model.tls.mca_key_path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.tls.mca_key_password') }}
    <Input v-model="model.tls.mca_key_password" editable clearable />
  </div>

  <div class="form-item">
    {{ t('kernel.endpoints.openconnect.form_entries.title') }}
    <Button icon="add" type="primary" @click="addFormEntry">{{ t('common.add') }}</Button>
  </div>
  <div v-if="model.form_entries.length" class="flex flex-col gap-8 mt-8">
    <Card v-for="(entry, index) in model.form_entries" :key="index" :title="`${index + 1}`">
      <template #extra>
        <Button icon="delete" type="text" size="small" @click="deleteFormEntry(index)" />
      </template>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.form_entries.form_id') }}
        <Input v-model="entry.form_id" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.form_entries.submission_key') }}
        <Input v-model="entry.submission_key" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.form_entries.name') }}
        <Input v-model="entry.name" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.form_entries.value') }}
        <Input v-model="entry.value" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.endpoints.openconnect.form_entries.promote') }}
        <Switch v-model="entry.promote" />
      </div>
    </Card>
  </div>
</template>
