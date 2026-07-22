<script lang="ts" setup>
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import { DomainStrategyOptions } from '@/constant/kernel'

import type { DnsProfile } from '@/types'

import DnsRulesConfig from './DnsRulesConfig.vue'
import DnsServersConfig from './DnsServersConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  ruleSetOptions: { label: string; value: string }[]
}

defineProps<Props>()

const model = defineModel<DnsProfile>({ required: true })

const serversOptions = computed(() =>
  model.value.servers.map((v) => ({ label: v.tag, value: v.id })),
)

const activeKey = ref('common')
const rulesConfigRef = useTemplateRef('rulesConfigRef')
const serversConfigRef = useTemplateRef('serversConfigRef')
const tabs = [
  { key: 'common', tab: 'kernel.dns.tab.common' },
  { key: 'servers', tab: 'kernel.dns.tab.servers' },
  { key: 'rules', tab: 'kernel.dns.tab.rules' },
]

const { t } = useI18n()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    servers: serversConfigRef.value?.handleAdd,
  }
  handlerMap[activeKey.value]?.()
}

defineExpose({ handleAdd })
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="tabs" tab-position="top">
    <template #common>
      <div class="form-item">
        {{ t('kernel.dns.final') }}
        <Select v-model="model.final" :options="serversOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.optimistic') }}
        <Switch v-model="model.optimistic" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.reverse_mapping') }}
        <Switch v-model="model.reverse_mapping" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.strategy') }}
        <Select v-model="model.strategy" :options="DomainStrategyOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.disable_cache') }}
        <Switch v-model="model.disable_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.disable_expire') }}
        <Switch v-model="model.disable_expire" />
      </div>

      <div class="form-item">
        {{ t('kernel.dns.client_subnet') }}
        <Input v-model="model.client_subnet" editable clearable />
      </div>
      <RawFieldsConfig v-model="model.fields" />
    </template>
    <template #servers>
      <DnsServersConfig
        ref="serversConfigRef"
        v-model="model.servers"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
      />
    </template>
    <template #rules>
      <DnsRulesConfig
        ref="rulesConfigRef"
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serversOptions"
        :rule-set-options="ruleSetOptions"
      />
    </template>
  </Tabs>
</template>
