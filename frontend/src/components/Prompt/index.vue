<script setup lang="ts" generic="T extends InputType = 'text'">
import { ref, computed } from 'vue'

import useI18n from '@/lang'

import type { InputType } from '@/components/Input/types'

import type { PromptProps } from './types'

const { initialValue = '', props: inputProps } = defineProps<PromptProps<T>>()

const emit = defineEmits<{
  confirm: [value: string | number]
  cancel: []
  finish: []
}>()

const value = ref(initialValue)

const inputType = computed(() => {
  return inputProps.type || (typeof initialValue === 'string' ? 'text' : 'number')
})

const { t } = useI18n.global

const handleSubmit = (e?: Event) => {
  if (e?.type === 'keydown' && inputProps.type === 'code') {
    return
  }

  emit('confirm', value.value)
  emit('finish')
}

const handleCancel = () => {
  emit('cancel')
  emit('finish')
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-confirm p-8 rounded-8 shadow max-w-[60%]">
      <div class="font-bold break-all px-4 py-8">{{ t(title) }}</div>
      <Input
        v-model="value"
        v-bind="inputProps"
        :type="inputType"
        autofocus
        clearable
        size="small"
        class="w-full"
        @keydown.enter="handleSubmit"
      />
      <div class="form-action gap-4">
        <Button size="small" @click="handleCancel">
          {{ t('common.cancel') }}
        </Button>
        <Button size="small" type="primary" @click="handleSubmit">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-confirm {
  min-width: 340px;
  background: var(--toast-bg);
}
</style>
