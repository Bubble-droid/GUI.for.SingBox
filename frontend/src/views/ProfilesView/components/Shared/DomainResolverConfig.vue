<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { DomainStrategyOptions } from '@/constant/kernel'
import { useBool } from '@/hooks'

import type { DomainResolver } from '@/types'

import DnsRouteOptionsConfig from './DnsRouteOptionsConfig.vue'

interface Props {
  serverOptions: { label: string; value: string }[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'kernel.domain_resolver.title',
})
const model = defineModel<DomainResolver>({ required: true })
const { t } = useI18n()

const [showResolver, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{ t(title) }}</Button>
  </Divider>
  <div v-show="showResolver">
    <DnsRouteOptionsConfig v-model="model" />
    <div class="form-item">
      {{ t('kernel.domain_resolver.server') }}
      <Select v-model="model.server" :options="serverOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.domain_resolver.strategy.title') }}
      <Select
        v-model="model.strategy"
        :placeholder="t('kernel.domain_resolver.strategy.default')"
        :options="DomainStrategyOptions"
        clearable
      />
    </div>
  </div>
</template>
