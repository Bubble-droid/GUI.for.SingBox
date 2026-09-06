<script setup lang="ts">
import { computed } from 'vue'

import useI18n from '@/lang'

import MarkdownViewer from '@/components/MarkdownViewer/index.vue'

export interface ConfirmOptions {
  type: 'text' | 'markdown'
  cancelText?: string
  okText?: string
}

interface Props {
  title: string
  message: string | Record<string, any>
  options?: ConfirmOptions
  cancel?: boolean
}

const { message, options = { type: 'text' }, cancel = true } = defineProps<Props>()

const emit = defineEmits<{
  confirm: [value: boolean]
  cancel: []
  finish: []
}>()

const { t } = useI18n.global

const content = computed(() => {
  if (typeof message !== 'string') {
    return JSON.stringify(message, null, 2)
  }
  if (options.type === 'text') {
    return t(message)
  }
  return message
})

const handleConfirm = () => {
  emit('confirm', true)
  emit('finish')
}

const handleCancel = () => {
  emit('cancel')
  emit('finish')
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-confirm flex flex-col p-8 rounded-8 shadow">
      <div class="font-bold break-all px-4 py-8">{{ t(title) }}</div>
      <div
        v-if="options.type === 'markdown'"
        class="flex-1 overflow-y-auto text-12 leading-relaxed p-6 break-all whitespace-pre-wrap select-text"
      >
        <MarkdownViewer :content="content" />
      </div>
      <div
        v-else
        class="flex-1 overflow-y-auto text-12 leading-relaxed p-6 break-all whitespace-pre-wrap select-text"
      >
        {{ content }}
      </div>
      <div class="form-action gap-4">
        <Button v-if="cancel" size="small" @click="handleCancel">
          {{ t(options.cancelText || 'common.cancel') }}
        </Button>
        <Button size="small" type="primary" @click="handleConfirm">
          {{ t(options.okText || 'common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-confirm {
  min-width: 340px;
  max-width: 60%;
  background: var(--toast-bg);
}
</style>
