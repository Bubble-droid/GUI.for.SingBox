<script lang="ts" setup>
import { DomainStrategyOptions } from '@profile/constant/options.ts'
import type {
  DnsRouteOptionsFormData,
  DomainResolverFormData,
} from '@profile/types/profiles/shared.ts'
import { useI18n } from 'vue-i18n'

import { useBool } from '@/hooks/useBool.ts'

import type { OptionItem } from '@/types/component.ts'

import DnsRouteOptionsForm from './DnsRouteOptionsForm.vue'

interface Props {
  dnsServerOptions: OptionItem[]
  title?: string
}

const model = defineModel<DomainResolverFormData>({ required: true })

const { title = 'kernel.shared.domain_resolver.title' } = defineProps<Props>()

const { t } = useI18n()

const [showResolver, toggleShow] = useBool(false)
</script>

<template>
  <Divider>
    <Button type="text" size="small" @click="toggleShow">{{ t(title) }}</Button>
  </Divider>
  <div v-show="showResolver">
    <DnsRouteOptionsForm v-model="model as DnsRouteOptionsFormData" />
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
