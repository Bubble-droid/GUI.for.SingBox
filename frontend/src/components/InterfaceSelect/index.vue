<script lang="ts" setup generic="M extends boolean = false">
import { onMounted, ref } from 'vue'

import { GetInterfaces } from '@/bridge/app'

import type { OptionItem } from '@/types/component'

interface Props {
  border?: boolean
  multiple?: M
}

type ModelType = M extends true ? string[] : string

const model = defineModel<ModelType>({ required: true })

withDefaults(defineProps<Props>(), {
  border: true,
  multiple: false as any,
})

const emits = defineEmits<{
  changed: [value: ModelType]
}>()

const options = ref<OptionItem[]>([])

const onChange = (val: ModelType) => {
  emits('changed', val)
}

onMounted(async () => {
  const interfaces = await GetInterfaces()
  options.value = interfaces.map((v) => ({ label: v, value: v }))
})
</script>

<template>
  <Select
    v-model="model"
    v-bind="$attrs"
    :options="options"
    :border="border"
    :multiple="multiple"
    @changed="onChange"
  />
</template>
