<script lang="ts" setup generic="M extends boolean = false">
import { onMounted, ref } from 'vue'

import { GetInterfaces } from '@/bridge/app'

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

const emits = defineEmits<(e: 'change', val: ModelType) => void>()

const options = ref<{ label: string; value: string }[]>([])

const onChange = (val: ModelType) => {
  emits('change', val)
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
    @change="onChange"
  />
</template>
