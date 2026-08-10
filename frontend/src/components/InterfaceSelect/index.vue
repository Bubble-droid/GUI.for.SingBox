<script lang="ts" setup generic="M extends boolean = false">
import { ref } from 'vue'

import { GetInterfaces } from '@/bridge'

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

GetInterfaces().then((res) => {
  options.value = res.map((v) => ({ label: v, value: v }))
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
