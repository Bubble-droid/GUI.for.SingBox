<script setup lang="ts">
import type { InputProps } from '@components/Input/types'
import { useTemplateRef } from 'vue'

type PortInputProps = Omit<InputProps<'number'>, 'type'>

const model = defineModel<number>({ required: true })

const { min = 1, max = 65535, clearable = true, ...restProps } = defineProps<PortInputProps>()

const emit = defineEmits<{
  changed: [value: number]
  confirm: [value: number]
}>()

const inputRef = useTemplateRef('inputRef')

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<template>
  <Input
    ref="inputRef"
    v-model="model"
    v-bind="restProps"
    type="number"
    :min="min"
    :max="max"
    :clearable="clearable"
    @changed="emit('changed', $event)"
    @confirm="emit('confirm', $event)"
  />
</template>
