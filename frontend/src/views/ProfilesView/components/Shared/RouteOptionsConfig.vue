<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { NetworkStrategyOptions, TlsSpoofMethodOptions } from '@/constant/kernel'
import { useBool } from '@/hooks'

import type { RouteOptions } from '@/types'

const model = defineModel<RouteOptions>({ required: true })
const { t } = useI18n()

const [showOptions, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{
      t('kernel.rules.action.route-options.title')
    }}</Button>
  </Divider>
  <div v-show="showOptions">
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.override_address') }}
      <Input v-model="model.override_address" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.override_port') }}
      <Input v-model="model.override_port" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.network_strategy') }}
      <Select v-model="model.network_strategy" :options="NetworkStrategyOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.fallback_delay') }}
      <Input v-model="model.fallback_delay" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.udp_disable_domain_unmapping') }}
      <Switch v-model="model.udp_disable_domain_unmapping" />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.udp_connect') }}
      <Switch v-model="model.udp_connect" />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.udp_timeout') }}
      <Input v-model="model.udp_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.tls_fragment') }}
      <Switch v-model="model.tls_fragment" />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.tls_fragment_fallback_delay') }}
      <Input v-model="model.tls_fragment_fallback_delay" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.tls_record_fragment') }}
      <Switch v-model="model.tls_record_fragment" />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.tls_spoof') }}
      <Input v-model="model.tls_spoof" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.rules.action.route-options.tls_spoof_method.title') }}
      <Select v-model="model.tls_spoof_method" :options="TlsSpoofMethodOptions" clearable />
    </div>
  </div>
</template>
