<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { DomainStrategyOptions } from '@/constant'
import { useBool } from '@/hooks'

import type { DomainResolver } from '@/features/config/types'
import type { ComponentOption } from '@/features/types'

import DnsRouteOptionsConfig from './DnsRouteOptionsConfig.vue'

interface Props {
  serverOptions: ComponentOption[]
  title?: string
}

withDefaults(defineProps<Props>(), {
  title: 'kernel.shared.domain_resolver.title',
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
      {{ t('kernel.shared.domain_resolver.server') }}
      <Select v-model="model.server" :options="serverOptions" clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.shared.domain_resolver.strategy.title') }}
      <Select
        v-model="model.strategy"
        :placeholder="t('kernel.shared.domain_resolver.strategy.default')"
        :options="DomainStrategyOptions"
        clearable
      />
    </div>
  </div>
</template>
