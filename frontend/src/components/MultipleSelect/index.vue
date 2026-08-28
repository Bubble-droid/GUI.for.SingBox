<script setup lang="ts" generic="T extends SelectModelValue = string">
import Select from '@/components/Select/index.vue'

import type { SelectModelValue, SelectProps } from '@/components/Select/types'

withDefaults(defineProps<Omit<SelectProps<T, true>, 'modelValue' | 'multiple'>>(), {
  options: () => [],
  border: true,
  size: 'default',
  placeholder: '',
  autoSize: false,
  clearable: false,
})

const model = defineModel<T[]>({ required: true })

const emits = defineEmits<{
  changed: [value: T[]]
}>()

const onChange = (val: T[]) => {
  emits('changed', val)
}
</script>

<template>
  <Select
    v-model="model"
    multiple
    :options="options"
    :border="border"
    :size="size"
    :placeholder="placeholder"
    :auto-size="autoSize"
    :clearable="clearable"
    @changed="onChange"
  />
</template>
