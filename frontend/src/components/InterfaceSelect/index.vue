<script lang="ts" setup>
import { ref } from 'vue'

import { GetInterfaces } from '@/bridge'

interface Props {
  border?: boolean
  multiple?: boolean
}

const model = defineModel<string | string[]>()

withDefaults(defineProps<Props>(), {
  border: true,
  multiple: false,
})

const emits = defineEmits(['change'])

const options = ref<any>([])

const onChange = (val: string | string[]) => {
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
