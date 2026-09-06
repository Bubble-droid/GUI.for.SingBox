<script lang="ts" setup>
import { message } from '@/utils/interaction'

import type { AppPlugin } from '@/types/app'
import type { Recordable } from '@/types/typescript'

interface Props {
  plugin: AppPlugin
}

const model = defineModel<Recordable>({ default: () => ({}) })

defineProps<Props>()

const emit = defineEmits<{
  change: [value: Recordable]
}>()

const isSameValue = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b)

const updateModel = (mutator: (draft: Recordable) => void) => {
  const next = { ...model.value }
  mutator(next)
  model.value = next
  emit('change', next)
}

const getOptions = (options?: string[]) => {
  return (
    options?.map((opt) => {
      const [label, value = label] = opt.split(',')
      return { label, value }
    }) ?? []
  )
}

const resolveComponent = (componentName: string) => {
  return componentName === 'CodeViewer' ? 'CodeEditor' : componentName
}

const onChange = (key: string, originalValue: unknown, value: unknown) => {
  updateModel((draft) => {
    if (isSameValue(originalValue, value)) {
      delete draft[key]
    } else {
      draft[key] = value
    }
  })
}

const handleReset = (key: string) => {
  updateModel((draft) => {
    delete draft[key]
  })
}

const handleResetAll = () => {
  model.value = {}
  emit('change', {})
  message.success('common.success')
}

defineExpose({ reset: handleResetAll })
</script>

<template>
  <div class="flex flex-col gap-8">
    <slot name="header" :handle-reset-all="handleResetAll" />

    <Card
      v-for="(conf, index) in plugin.configuration"
      :key="conf.id"
      :title="`${index + 1}. ${conf.title}`"
      :class="{ warn: model[conf.key] !== undefined }"
      class="card"
    >
      <template v-if="model[conf.key] !== undefined" #extra>
        <Button
          v-tips="'settings.plugin.resetSetting'"
          :icon-size="12"
          icon="clear"
          type="text"
          size="small"
          @click="handleReset(conf.key)"
        />
      </template>

      <div class="mb-8 text-12">{{ conf.description }}</div>

      <component
        :is="resolveComponent(conf.component)"
        :model-value="model[conf.key] ?? conf.value"
        :options="getOptions(conf.options)"
        :autofocus="false"
        editable
        lang="yaml"
        @change="(val: unknown) => onChange(conf.key, conf.value, val)"
      />
    </Card>
  </div>
</template>

<style scoped>
.card {
  border-left: 2px solid transparent;
}
.warn {
  border-left: 2px solid var(--primary-color);
}
</style>
