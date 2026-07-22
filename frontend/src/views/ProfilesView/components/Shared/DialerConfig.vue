<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { NetworkStrategyOptions, NetworkTypeOptions } from '@/constant/kernel.ts'
import { useBool } from '@/hooks'

import type { Dialer } from '@/types'

import DomainResolverConfig from './DomainResolverConfig.vue'

interface Props {
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
}

defineProps<Props>()
const model = defineModel<Dialer>({ required: true })
const { t } = useI18n()

const [showDialer, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{ t('kernel.dialer.title') }}</Button>
  </Divider>
  <div v-show="showDialer">
    <div class="form-item">
      {{ t('kernel.dialer.detour.title') }}
      <Select
        v-model="model.detour"
        :placeholder="t('kernel.dialer.detour.default')"
        :options="outboundOptions"
        clearable
      />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.bind_interface') }}
      <Input v-model="model.bind_interface" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.inet4_bind_address') }}
      <Input v-model="model.inet4_bind_address" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.inet6_bind_address') }}
      <Input v-model="model.inet6_bind_address" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.bind_address_no_port') }}
      <Switch v-model="model.bind_address_no_port" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.protect_path') }}
      <Input v-model="model.protect_path" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.routing_mark') }}
      <Input v-model="model.routing_mark" type="number" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.reuse_addr') }}
      <Switch v-model="model.reuse_addr" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.netns') }}
      <Input v-model="model.netns" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.connect_timeout') }}
      <Input v-model="model.connect_timeout" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.tcp_fast_open') }}
      <Switch v-model="model.tcp_fast_open" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.tcp_multi_path') }}
      <Switch v-model="model.tcp_multi_path" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.disable_tcp_keep_alive') }}
      <Switch v-model="model.disable_tcp_keep_alive" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.tcp_keep_alive') }}
      <Input v-model="model.tcp_keep_alive" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.tcp_keep_alive_interval') }}
      <Input v-model="model.tcp_keep_alive_interval" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.udp_fragment') }}
      <Switch v-model="model.udp_fragment" />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.network_strategy') }}
      <Select v-model="model.network_strategy" :options="NetworkStrategyOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.network_type') }}
      <MultipleSelect v-model="model.network_type" :options="NetworkTypeOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.fallback_network_type') }}
      <MultipleSelect
        v-model="model.fallback_network_type"
        :options="NetworkTypeOptions"
        clearable
      />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.fallback_delay') }}
      <Input v-model="model.fallback_delay" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.dialer.network_fallback_delay') }}
      <Input v-model="model.network_fallback_delay" editable clearable />
    </div>
  </div>
  <DomainResolverConfig v-model="model.domain_resolver" :server-options="serverOptions" />
</template>
