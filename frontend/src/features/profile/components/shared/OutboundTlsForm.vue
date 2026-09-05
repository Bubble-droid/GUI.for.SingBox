<script lang="ts" setup>
import {
  TlsEngineOptions,
  TlsVersionOptions,
  TlsCipherSuiteOptions,
  TlsCurvePreferenceOptions,
  TlsSpoofMethodOptions,
  UtlsFingerprintOptions,
} from '@profile/constant/options'
import type { OutboundTlsFormData } from '@profile/types/profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool'

const model = defineModel<OutboundTlsFormData>({ required: true })
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
        {{ t('kernel.shared.tls.engine.title') }}
        <Select v-model="model.engine" :options="TlsEngineOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.disable_sni') }}
        <Switch v-model="model.disable_sni" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.server_name') }}
        <Input v-model="model.server_name" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.insecure') }}
        <Switch v-model="model.insecure" />
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
      <div
        class="form-item"
        :class="{ 'items-start': !!model.certificate_public_key_sha256.length }"
      >
        {{ t('kernel.shared.tls.certificate_public_key_sha256') }}
        <InputList v-model="model.certificate_public_key_sha256" />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.client_certificate.length }">
        {{ t('kernel.shared.tls.client_certificate') }}
        <InputList v-model="model.client_certificate" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.client_certificate_path') }}
        <Input v-model="model.client_certificate_path" editable clearable />
      </div>
      <div class="form-item" :class="{ 'items-start': !!model.client_key.length }">
        {{ t('kernel.shared.tls.client_key') }}
        <InputList v-model="model.client_key" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.client_key_path') }}
        <Input v-model="model.client_key_path" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.fragment') }}
        <Switch v-model="model.fragment" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.fragment_fallback_delay') }}
        <Input v-model="model.fragment_fallback_delay" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.record_fragment') }}
        <Switch v-model="model.record_fragment" />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.spoof') }}
        <Input v-model="model.spoof" editable clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.shared.tls.spoof_method.title') }}
        <Select v-model="model.spoof_method" :options="TlsSpoofMethodOptions" clearable />
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

      <!-- ECH -->
      <Divider>{{ t('kernel.shared.tls.ech.title') }}</Divider>
      <div class="form-item">
        {{ t('kernel.shared.tls.ech.enabled') }}
        <Switch v-model="model.ech.enabled" />
      </div>
      <template v-if="model.ech.enabled">
        <div class="form-item" :class="{ 'items-start': !!model.ech.config.length }">
          {{ t('kernel.shared.tls.ech.config') }}
          <InputList v-model="model.ech.config" />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.ech.config_path') }}
          <Input v-model="model.ech.config_path" editable clearable />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.ech.query_server_name') }}
          <Input v-model="model.ech.query_server_name" editable clearable />
        </div>
      </template>

      <!-- uTLS -->
      <Divider>{{ t('kernel.shared.tls.utls.title') }}</Divider>
      <div class="form-item">
        {{ t('kernel.shared.tls.utls.enabled') }}
        <Switch v-model="model.utls.enabled" />
      </div>
      <template v-if="model.utls.enabled">
        <div class="form-item">
          {{ t('kernel.shared.tls.utls.fingerprint') }}
          <Select v-model="model.utls.fingerprint" :options="UtlsFingerprintOptions" clearable />
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
          {{ t('kernel.shared.tls.reality.public_key') }}
          <Input v-model="model.reality.public_key" clearable />
        </div>
        <div class="form-item">
          {{ t('kernel.shared.tls.reality.short_id') }}
          <InputList v-model="model.reality.short_id" />
        </div>
      </template>
    </template>
  </div>
</template>
