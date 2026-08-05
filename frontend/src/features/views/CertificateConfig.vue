<script lang="ts" setup>
import { CertificateStoreOptions } from '@features/constant/options'
import type { CertificateConfig } from '@profiles/certificate'
import { useI18n } from 'vue-i18n'

const model = defineModel<CertificateConfig>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.certificate.store.title') }}
    <Select
      v-model="model.store"
      :placeholder="t('kernel.certificate.store.system')"
      :options="CertificateStoreOptions"
      clearable
    />
  </div>

  <div class="form-item" :class="{ 'items-start': !!model.certificate.length }">
    {{ t('kernel.certificate.certificate') }}
    <InputList v-model="model.certificate" />
  </div>

  <div class="form-item" :class="{ 'items-start': !!model.certificate_path.length }">
    {{ t('kernel.certificate.certificate_path') }}
    <InputList v-model="model.certificate_path" />
  </div>

  <div class="form-item" :class="{ 'items-start': !!model.certificate_directory_path.length }">
    {{ t('kernel.certificate.certificate_directory_path') }}
    <InputList v-model="model.certificate_directory_path" />
  </div>
</template>
