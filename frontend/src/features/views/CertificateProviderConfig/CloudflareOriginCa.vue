<script lang="ts" setup>
import {
  CloudflareOriginCaRequestTypeOptions,
  CloudflareOriginCaValidityOptions,
} from '@features/constant/options'
import type { CertificateProviderCloudflareOriginCa } from '@profiles/certificate_provider'
import { useI18n } from 'vue-i18n'

import type { ComponentOption } from '@/types/views'

interface Props {
  httpClientOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<CertificateProviderCloudflareOriginCa['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item" :class="{ 'items-start': !!model.domain.length }">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.domain') }}
    <InputList v-model="model.domain" />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.data_directory') }}
    <Input v-model="model.data_directory" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.api_token') }}
    <Input v-model="model.api_token" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.origin_ca_key') }}
    <Input v-model="model.origin_ca_key" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.request_type.title') }}
    <Select
      v-model="model.request_type"
      :options="CloudflareOriginCaRequestTypeOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.requested_validity.title') }}
    <Select
      v-model="model.requested_validity"
      :options="CloudflareOriginCaValidityOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.certificate_providers.cloudflare_origin_ca.http_client') }}
    <Select v-model="model.http_client" :options="httpClientOptions" clearable />
  </div>
</template>
