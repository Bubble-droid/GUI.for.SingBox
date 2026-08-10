<script lang="ts" setup>
import type { CertificateProviderTailscale } from '@profiles/certificate_provider'
import { useI18n } from 'vue-i18n'

import type { ComponentOption } from '@/types/views'

interface Props {
  tailscaleOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<CertificateProviderTailscale['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.certificate_providers.tailscale.endpoint') }}
    <Select v-model="model.endpoint" :options="tailscaleOptions" clearable />
  </div>
</template>
