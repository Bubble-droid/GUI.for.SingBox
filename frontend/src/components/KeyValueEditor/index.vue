<script lang="ts" setup>
import { ref, watch } from 'vue'

import type { Recordable } from '@/types/typescript'

const model = defineModel<Recordable<string>>({ required: true })

const { placeholder = ['key', 'value'] } = defineProps<{
  placeholder?: [string, string]
}>()

const emit = defineEmits<{
  change: [obj: Recordable<string>]
}>()

const entries = ref<[string, string][]>(Object.entries(model.value))

const handleDel = (i: number) => {
  entries.value.splice(i, 1)
  emitUpdate()
}

const handleAdd = () => {
  entries.value.push(['', ''])
  emitUpdate()
}

let internalUpdate = false

watch(
  model,
  (val) => {
    if (internalUpdate) {
      internalUpdate = false
      return
    }
    entries.value = Object.entries(val ?? {})
  },
  { deep: true },
)

const emitUpdate = () => {
  const obj = Object.fromEntries(entries.value)
  internalUpdate = true
  model.value = obj
  emit('change', obj)
}
</script>

<template>
  <div class="gui-kv-editor inline-flex flex-col">
    <div v-for="(entry, i) in entries" :key="i" class="flex items-center mb-4">
      <Input
        v-model="entry[0]"
        :placeholder="placeholder[0]"
        auto-size
        class="flex-1"
        @confirm="emitUpdate"
      />
      <Button type="text" :icon-size="12" icon="close" @click="handleDel(i)" />
      <Input
        v-model="entry[1]"
        :placeholder="placeholder[1]"
        auto-size
        class="flex-1"
        @confirm="emitUpdate"
      />
    </div>
    <Button type="primary" icon="add" @click="handleAdd" />
  </div>
</template>

<style lang="less" scoped>
.gui-kv-editor {
  min-width: 400px;
}
</style>
