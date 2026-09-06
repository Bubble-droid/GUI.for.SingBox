<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import type { OptionItem } from '@/types/component'

interface Props {
  options?: OptionItem[]
  size?: 'default' | 'small'
}

const model = defineModel<string[]>({ required: true })

const { options = [], size = 'default' } = defineProps<Props>()

const emit = defineEmits<{
  change: [value: string[]]
}>()

const { t } = useI18n()

const isActive = (val: string) => model.value.includes(val)

const handleSelect = (val: string) => {
  const next = model.value.includes(val)
    ? model.value.filter((item) => item !== val)
    : [...model.value, val]

  model.value = next
  emit('change', next)
}
</script>

<template>
  <div :class="[size]" class="gui-checkbox inline-flex rounded-8 overflow-hidden text-12">
    <div
      v-for="o in options"
      :key="o.value"
      :class="{ active: isActive(o.value) }"
      class="gui-checkbox-button cursor-pointer px-12 py-6 transition duration-200 line-clamp-1 break-all"
      @click="handleSelect(o.value)"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-checkbox {
  border: 1px solid var(--primary-color);
  &-button {
    color: var(--radio-normal-color);
    background-color: var(--radio-normal-bg);
    border-left: 1px solid var(--primary-color);
    &:nth-child(1) {
      border-left: none;
    }
    &:hover {
      color: var(--radio-normal-hover-color);
    }
  }
  .active {
    color: var(--radio-primary-color);
    background-color: var(--radio-primary-bg);
    &:hover {
      background-color: var(--radio-primary-hover-bg);
    }
    &:active {
      background-color: var(--radio-primary-active-bg);
    }
  }
}

.small {
  .gui-checkbox-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
