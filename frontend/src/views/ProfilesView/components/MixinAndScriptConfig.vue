<script setup lang="ts">
import type { Mixin, Script } from '@profiles'
import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { parse, stringify } from 'yaml'

import { message } from '@/utils/interaction'

const model = defineModel<{ mixin: Mixin; script: Script }>({
  required: true,
})

const { t } = useI18n()

const activeTab = ref('mixin')

const tabItems = [
  { key: 'mixin', tab: 'profile.mixinSettings.name' },
  { key: 'script', tab: 'profile.scriptSettings.name' },
]

const MixinPriorityOptions = [
  { label: 'profile.mixinSettings.mixin', value: 'mixin' },
  { label: 'profile.mixinSettings.gui', value: 'gui' },
] as const

const MixinFormatOptions = [
  { label: 'JSON', value: 'json' },
  { label: 'YAML', value: 'yaml' },
] as const

const onFormatChange = (val: 'json' | 'yaml' | Event, old?: 'json' | 'yaml') => {
  if (typeof val !== 'string') {
    return
  }
  try {
    const config = parse(model.value.mixin.config)
    if (config) {
      if (val === 'json') {
        model.value.mixin.config = JSON.stringify(config, null, 2)
      } else {
        model.value.mixin.config = stringify(config)
      }
    }
  } catch (error: any) {
    if (old) {
      model.value.mixin.format = old
    }
    message.error(error.message || error)
  }
}
</script>

<template>
  <Tabs v-model:active-key="activeTab" :items="tabItems">
    <template #mixin>
      <div class="form-item">
        {{ t('profile.mixinSettings.priority') }}
        <Radio v-model="model.mixin.priority" :options="MixinPriorityOptions" />
      </div>
      <div class="form-item">
        {{ t('profile.mixinSettings.format') }}
        <Radio
          v-model="model.mixin.format"
          :options="MixinFormatOptions"
          @change="onFormatChange"
        />
      </div>
      <CodeEditor v-model="model.mixin.config" :lang="model.mixin.format" editable />
    </template>
    <template #script>
      <CodeEditor v-model="model.script.code" lang="javascript" editable />
    </template>
  </Tabs>
</template>
