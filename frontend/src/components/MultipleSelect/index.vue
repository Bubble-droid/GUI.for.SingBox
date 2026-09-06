<script setup lang="ts" generic="T extends SelectModelValue = string">
import Select from '@/components/Select/index.vue'

import type { SelectModelValue, SelectProps } from '@/components/Select/types'

const model = defineModel<T[]>({ required: true })

const {
  options = [],
  border = true,
  size = 'default',
  placeholder = '',
} = defineProps<Omit<SelectProps<T, true>, 'multiple'>>()

const emit = defineEmits<{
  changed: [value: T[]]
}>()

const onChange = (val: T[]) => {
  emit('changed', val)
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
