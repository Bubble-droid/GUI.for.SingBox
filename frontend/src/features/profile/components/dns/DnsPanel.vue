<script lang="ts" setup>
import { DomainStrategyOptions } from '@profile/constant/options.ts'
import type { DnsSection } from '@profile/types/profiles/dns.ts'
import type { RuleSetItem } from '@profile/types/profiles/route.ts'
import { computed, ref, useTemplateRef } from 'vue'
import { useI18n } from 'vue-i18n'

import type { OptionItem } from '@/types/component.ts'

import RuleList from './RuleList.vue'
import ServerList from './ServerList.vue'

interface Props {
  inboundOptions: OptionItem[]
  outboundOptions: OptionItem[]
  ruleSet: RuleSetItem[]
}

defineProps<Props>()

const model = defineModel<DnsSection>({ required: true })

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
    common: () => {
      /* empty */
    },
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
        {{ t('kernel.dns.disable_cache') }}
        <Switch v-model="model.disable_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.disable_expire') }}
        <Switch v-model="model.disable_expire" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.independent_cache') }}
        <Switch v-model="model.independent_cache" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.final') }}
        <Select v-model="model.final" :options="serversOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.strategy') }}
        <Select v-model="model.strategy" :options="DomainStrategyOptions" />
      </div>
      <div class="form-item">
        {{ t('kernel.dns.client_subnet') }}
        <Input v-model="model.client_subnet" editable />
      </div>
    </template>
    <template #servers>
      <ServerList
        ref="serversConfigRef"
        v-model="model.servers"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
      />
    </template>
    <template #rules>
      <RuleList
        ref="rulesConfigRef"
        v-model="model.rules"
        :inbound-options="inboundOptions"
        :outbound-options="outboundOptions"
        :servers-options="serversOptions"
        :rule-set="ruleSet"
      />
    </template>
  </Tabs>
</template>
