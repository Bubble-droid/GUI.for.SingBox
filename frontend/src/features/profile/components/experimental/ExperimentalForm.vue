<script lang="ts" setup>
import { PredefinedClashModeOptions } from '@profile/constant/options'
import type { ExperimentalSection } from '@profile/types/profiles'
import { useI18n } from 'vue-i18n'

import { generateSecureKey, sampleID } from '@/utils/others'

import type { OptionItem } from '@/types/component'

interface Props {
  outboundOptions: OptionItem[]
}

defineProps<Props>()

const model = defineModel<ExperimentalSection>({ required: true })

const { t } = useI18n()
</script>

<template>
  <div>
    <Divider>{{ t('kernel.experimental.clash_api.title') }}</Divider>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.external_controller') }}
      <Input v-model="model.clash_api.external_controller" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.secret') }}
      <div class="flex items-center">
        <Input v-model="model.clash_api.secret" editable clearable>
          <template #suffix>
            <Button
              type="text"
              size="small"
              icon="refresh"
              @click="() => (model.clash_api.secret = generateSecureKey())"
            />
          </template>
        </Input>
      </div>
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.external_ui') }}
      <Input v-model="model.clash_api.external_ui" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.external_ui_download_url') }}
      <Input v-model="model.clash_api.external_ui_download_url" editable />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.external_ui_download_detour') }}
      <Select
        v-model="model.clash_api.external_ui_download_detour"
        :options="outboundOptions"
        clearable
      />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.default_mode') }}
      <Select v-model="model.clash_api.default_mode as any" :options="PredefinedClashModeOptions" />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.clash_api.access_control_allow_private_network') }}
      <Switch v-model="model.clash_api.access_control_allow_private_network" />
    </div>
    <div
      :class="{
        'items-start': model.clash_api.access_control_allow_origin.length !== 0,
      }"
      class="form-item"
    >
      {{ t('kernel.experimental.clash_api.access_control_allow_origin') }}
      <InputList v-model="model.clash_api.access_control_allow_origin" />
    </div>
    <Divider>{{ t('kernel.experimental.cache_file.title') }} </Divider>
    <div class="form-item">
      {{ t('kernel.experimental.cache_file.enabled') }}
      <Switch v-model="model.cache_file.enabled" />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.cache_file.path') }}
      <Input v-model="model.cache_file.path" editable clearable />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.cache_file.cache_id') }}
      <Input v-model="model.cache_file.cache_id" editable clearable>
        <template #suffix>
          <Button
            type="text"
            size="small"
            icon="refresh"
            @click="() => (model.cache_file.cache_id = sampleID())"
          />
        </template>
      </Input>
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.cache_file.store_fakeip') }}
      <Switch v-model="model.cache_file.store_fakeip" />
    </div>
    <div class="form-item">
      {{ t('kernel.experimental.cache_file.store_dns') }}
      <Switch v-model="model.cache_file.store_dns" />
    </div>
  </div>
</template>
