<script lang="ts" setup>
import { DomainStrategyOptions } from '@features/constant/options.ts'
import type { DnsRouteOptions, DomainResolver } from '@profiles/shared'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks'

import type { ComponentOption } from '@/types/views'

import DnsRouteOptionsConfig from './DnsRouteOptionsConfig.vue'

interface Props {
  dnsServerOptions: ComponentOption[]
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
    <DnsRouteOptionsConfig v-model="model as DnsRouteOptions" />
    <div class="form-item">
      {{ t('kernel.shared.domain_resolver.server') }}
      <Select v-model="model.server" :options="dnsServerOptions" clearable />
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
