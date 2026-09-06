<script lang="ts" setup>
import type { TailscaleCertProvider } from '@profile/types/profiles/cert-provider'
import { useI18n } from 'vue-i18n'

import type { OptionItem } from '@/types/component'

interface Props {
  tailscaleOptions: OptionItem[]
}

const model = defineModel<TailscaleCertProvider['config']>({ required: true })
defineProps<Props>()
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.certificate_providers.tailscale.endpoint') }}
    <Select v-model="model.endpoint" :options="tailscaleOptions" clearable />
  </div>
</template>
