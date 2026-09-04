<script setup lang="ts" generic="T extends string | number | boolean = string">
import { useI18n } from 'vue-i18n'

import type { OptionItem } from '@/types/component'

interface Props {
  options?: readonly OptionItem<T>[]
  size?: 'default' | 'small'
}

const model = defineModel<T>({ required: true })

const { options = [], size = 'default' } = defineProps<Props>()

const emits = defineEmits<{
  change: [val: T, oldVal?: T]
}>()

const { t } = useI18n()

const handleSelect = (val: T) => {
  const oldValue = model.value
  if (oldValue === val) {
    return
  }
  model.value = val
  emits('change', val, oldValue)
}
</script>

<template>
  <div :class="[size]" class="gui-radio inline-flex rounded-full text-12 overflow-hidden">
    <div
      v-for="o in options"
      :key="String(o.value)"
      v-tips.slow="o.label"
      :class="{ active: o.value === model }"
      class="gui-radio-button cursor-pointer px-12 py-6 duration-200 line-clamp-1 break-all"
      @click="handleSelect(o.value)"
    >
      {{ t(o.label) }}
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-radio {
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
  .gui-radio-button {
    font-size: 10px;
    padding: 4px 8px;
  }
}
</style>
