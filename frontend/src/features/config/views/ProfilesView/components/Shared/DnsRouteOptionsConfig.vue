<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import type { DnsRouteOptions } from '@/features/config/types'

const model = defineModel<DnsRouteOptions>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.rules.action.route-options.disable_cache') }}
    <Switch v-model="model.disable_cache" />
  </div>
  <div class="form-item">
    {{ t('kernel.rules.action.route-options.disable_optimistic_cache') }}
    <Switch v-model="model.disable_optimistic_cache" />
  </div>
  <div class="form-item">
    {{ t('kernel.rules.action.route-options.rewrite_ttl') }}
    <Input v-model="model.rewrite_ttl" type="number" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.rules.action.route-options.timeout') }}
    <Input v-model="model.timeout" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.rules.action.route-options.client_subnet') }}
    <Input v-model="model.client_subnet" editable clearable />
  </div>
</template>
