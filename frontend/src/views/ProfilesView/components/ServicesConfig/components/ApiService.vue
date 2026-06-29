<script lang="ts" setup>
import { useI18n } from 'vue-i18n'

import { generateSecureKey } from '@/utils'

import type { ApiServiceProfile, ComponentOption } from '@/types'

interface Props {
  httpClientOptions: ComponentOption[]
}

defineProps<Props>()
const model = defineModel<ApiServiceProfile['config']>({ required: true })
const { t } = useI18n()
</script>

<template>
  <div class="form-item">
    {{ t('kernel.services.api.dashboard.enabled') }}
    <Switch v-model="model.dashboard.enabled" />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.dashboard.path') }}
    <Input v-model="model.dashboard.path" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.dashboard.download_url') }}
    <Input v-model="model.dashboard.download_url" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.dashboard.http_client.title') }}
    <Select
      v-model="model.dashboard.http_client"
      :placeholder="t('kernel.services.api.dashboard.http_client.default')"
      :options="httpClientOptions"
      clearable
    />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.dashboard.update_interval') }}
    <Input v-model="model.dashboard.update_interval" editable clearable />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.secret') }}
    <div class="flex items-center">
      <Input v-model="model.secret" editable clearable>
        <template #suffix>
          <Button
            type="text"
            size="small"
            icon="refresh"
            @click="() => (model.secret = generateSecureKey())"
          />
        </template>
      </Input>
    </div>
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.access_control_allow_origin') }}
    <InputList v-model="model.access_control_allow_origin" />
  </div>
  <div class="form-item">
    {{ t('kernel.services.api.access_control_allow_private_network') }}
    <Switch v-model="model.access_control_allow_private_network" />
  </div>
</template>
