<script lang="ts" setup>
import {
  TlsVersionOptions,
  TlsCipherSuiteOptions,
  TlsCurvePreferenceOptions,
  TlsClientAuthenticationOptions,
} from '@profile/constant/options'
import type { InboundTlsForm } from '@profile/types/profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'

import type { OptionItem } from '@/types/component'

import DialerConfig from './DialerConfig.vue'
import PortInput from './PortInput.vue'

interface Props {
  certProviderOptions: OptionItem[]
  netnsOptions: OptionItem[]
  outboundOptions: OptionItem[]
  dnsServerOptions: OptionItem[]
}

defineProps<Props>()

const model = defineModel<InboundTlsForm>({ required: true })
const { t } = useI18n()

const [showTls, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{ t('kernel.shared.tls.title') }}</Button>
  </Divider>
  <div v-show="showTls">
    <div class="form-item">
      {{ t('kernel.shared.tls.enabled') }}
      <Switch v-model="model.enabled" />
    </div>

    <template v-if="model.enabled">
      <div class="form-item">
        {{ t('kernel.shared.tls.server_name') }}
        <Input v-model="model.server_name" editable clearable />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.alpn.length }">
        {{ t('kernel.shared.tls.alpn') }}
        <InputList v-model="model.alpn" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.min_version.title') }}
        <Select v-model="model.min_version" :options="TlsVersionOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.max_version.title') }}
        <Select v-model="model.max_version" :options="TlsVersionOptions" clearable />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.cipher_suites.length }">
        {{ t('kernel.shared.tls.cipher_suites') }}
        <MultipleSelect v-model="model.cipher_suites" :options="TlsCipherSuiteOptions" clearable />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.curve_preferences.length }">
        {{ t('kernel.shared.tls.curve_preferences') }}
        <MultipleSelect
          v-model="model.curve_preferences"
          :options="TlsCurvePreferenceOptions"
          clearable
        />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.certificate.length }">
        {{ t('kernel.shared.tls.certificate') }}
        <InputList v-model="model.certificate" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.certificate_path') }}
        <Input v-model="model.certificate_path" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.client_authentication.title') }}
        <Select
          v-model="model.client_authentication"
          :options="TlsClientAuthenticationOptions"
          clearable
        />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.client_certificate.length }">
        {{ t('kernel.shared.tls.client_certificate') }}
        <InputList v-model="model.client_certificate" />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.client_certificate_path.length }">
        {{ t('kernel.shared.tls.client_certificate_path') }}
        <InputList v-model="model.client_certificate_path" />
      </div>
      <div
        class="form-item"
        :class="{ 'items-start': !!model.client_certificate_public_key_sha256.length }"
      >
        {{ t('kernel.shared.tls.client_certificate_public_key_sha256') }}
        <InputList v-model="model.client_certificate_public_key_sha256" />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.key.length }">
        {{ t('kernel.shared.tls.key') }}
        <InputList v-model="model.key" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.key_path') }}
        <Input v-model="model.key_path" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.kernel_tx') }}
        <Switch v-model="model.kernel_tx" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.kernel_rx') }}
        <Switch v-model="model.kernel_rx" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.handshake_timeout') }}
        <Input v-model="model.handshake_timeout" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.certificate_provider') }}
        <Select v-model="model.certificate_provider" :options="certProviderOptions" clearable />
      </div>

      <!-- ECH -->
      <Divider>{{ t('kernel.shared.tls.ech.title') }}</Divider>
      <div class="form-item">
        {{ t('kernel.shared.tls.ech.enabled') }}
        <Switch v-model="model.ech.enabled" />
      </div>
      <template v-if="model.ech.enabled">
        <div class="form-item" :class="{ 'items-start': !!model.ech.key.length }">
          {{ t('kernel.shared.tls.ech.key') }}
          <InputList v-model="model.ech.key" />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.ech.key_path') }}
          <Input v-model="model.ech.key_path" editable clearable />
        </div>
      </template>

      <!-- REALITY -->
      <Divider>{{ t('kernel.shared.tls.reality.title') }}</Divider>
      <div class="form-item">
        {{ t('kernel.shared.tls.reality.enabled') }}
        <Switch v-model="model.reality.enabled" />
      </div>
      <template v-if="model.reality.enabled">
        <div class="form-item">
          {{ t('kernel.shared.tls.reality.handshake.server') }}
          <Input v-model="model.reality.handshake.server" editable clearable />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.reality.handshake.server_port') }}
          <PortInput v-model="model.reality.handshake.server_port" editable />
        </div>
        <DialerConfig
          v-model="model.reality.handshake.dialer"
          :netns-options="netnsOptions"
          :outbound-options="outboundOptions"
          :dns-server-options="dnsServerOptions"
        />
        <div class="form-item">
          {{ t('kernel.shared.tls.reality.private_key') }}
          <Input v-model="model.reality.private_key" clearable />
        </div>
        <div class="form-item" :class="{ 'items-start': !!model.reality.short_id.length }">
          {{ t('kernel.shared.tls.reality.short_id') }}
          <InputList v-model="model.reality.short_id" />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.reality.max_time_difference') }}
          <Input v-model="model.reality.max_time_difference" editable clearable />
        </div>
      </template>
    </template>
  </div>
</template>
