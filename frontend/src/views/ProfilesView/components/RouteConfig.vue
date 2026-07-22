<script lang="ts" setup>
import { ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { RouteProfile } from '@/types'

import RouteRulesConfig from './RouteRulesConfig.vue'
import RouteRulesetConfig from './RouteRulesetConfig.vue'
import DomainResolverConfig from './Shared/DomainResolverConfig.vue'
import RawFieldsConfig from './Shared/RawFieldsConfig.vue'

interface Props {
  inboundOptions: { label: string; value: string }[]
  outboundOptions: { label: string; value: string }[]
  serverOptions: { label: string; value: string }[]
  ruleSetOptions: { label: string; value: string }[]
  httpClientOptions: { label: string; value: string }[]
}

defineProps<Props>()

const model = defineModel<RouteProfile>({ required: true })

const activeKey = ref('common')
const rulesConfigRef = useTemplateRef('rulesConfigRef')
const ruleSetConfigRef = useTemplateRef('ruleSetConfigRef')
const tabs = [
  { key: 'common', tab: 'kernel.route.tab.common' },
  { key: 'rule_set', tab: 'kernel.route.tab.rule_set' },
  { key: 'rules', tab: 'kernel.route.tab.rules' },
]

const { t } = useI18n()

const handleAdd = () => {
  const handlerMap: Record<string, (() => void) | undefined> = {
    common: () => {},
    rules: rulesConfigRef.value?.handleAdd,
    rule_set: ruleSetConfigRef.value?.handleAdd,
  }
  handlerMap[activeKey.value]?.()
}

defineExpose({ handleAdd })
</script>

<template>
  <Tabs v-model:active-key="activeKey" :items="tabs" tab-position="top">
    <template #common>
      <div class="form-item">
        {{ t('kernel.route.auto_detect_interface') }}
        <Switch v-model="model.auto_detect_interface" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.default_interface') }}
        <InterfaceSelect v-model="model.default_interface" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.route.final') }}
        <Select v-model="model.final" :options="outboundOptions" clearable />
      </div>
      <div class="form-item">
        {{ t('kernel.route.find_process') }}
        <Switch v-model="model.find_process" />
      </div>
      <div class="form-item">
        {{ t('kernel.route.default_http_client') }}
        <Select v-model="model.default_http_client" :options="httpClientOptions" clearable />
      </div>
      <DomainResolverConfig
        v-model="model.default_domain_resolver"
        :server-options="serverOptions"
        title="kernel.route.default_domain_resolver"
      />
      <RawFieldsConfig v-model="model.fields" />
    </template>

    <template #rule_set>
      <RouteRulesetConfig
        ref="ruleSetConfigRef"
        v-model="model.rule_set"
        :http-client-options="httpClientOptions"
      />
    </template>
    <template #rules>
      <RouteRulesConfig
        ref="rulesConfigRef"
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :server-options="serverOptions"
        :rule-set-options="ruleSetOptions"
      />
    </template>
  </Tabs>
</template>
