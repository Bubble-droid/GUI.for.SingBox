<script lang="ts" setup generic="M extends boolean = false">
import type { SelectProps, SelectValueType } from '@components/Select/types'
import { onMounted, ref } from 'vue'

import { GetInterfaces } from '@/bridge/app'

import type { OptionItem } from '@/types/component'

type ModelType = M extends true ? string[] : string

const model = defineModel<ModelType>({ required: true })

const {
  border = true,
  multiple,
  ...restProps
} = defineProps<Omit<SelectProps<string, M>, 'options'>>()

const emit = defineEmits<{
  changed: [value: ModelType]
}>()

const options = ref<OptionItem[]>([])

const onChange = (val: ModelType) => {
  emit('changed', val)
}

onMounted(async () => {
  const interfaces = await GetInterfaces()
  options.value = interfaces.map((v) => ({ label: v, value: v }))
})
</script>

<template>
  <Select
    v-model="model as SelectValueType<string, M>"
    v-bind="restProps"
    :options="options"
    :border="border"
    :multiple="multiple"
    @changed="onChange($event as ModelType)"
  />
</template>
