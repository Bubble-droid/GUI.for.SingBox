<script setup lang="ts" generic="ValueType = any, PickerType extends 'single' | 'multi' = 'single'">
import { ref, toRaw } from 'vue'
import type { Ref } from 'vue'

import useI18n from '@/lang'

import type { PickerItem, PickerProps } from './types'

type PickerValue = PickerType extends 'single' ? ValueType : ValueType[]

const { type, options = [], initialValue = [] } = defineProps<PickerProps<ValueType, PickerType>>()

const emit = defineEmits<{
  confirm: [val: PickerValue]
  cancel: []
  finish: []
}>()

const selected = ref(
  new Set(initialValue.filter((v) => options.find((o) => o.value === v)).map((v) => toRaw(v))),
) as Ref<Set<ValueType>>

const { t } = useI18n.global

const handleConfirm = () => {
  const res = [...selected.value].map((v) => toRaw(v))
  if (type === 'single') {
    emit('confirm', res[0] as PickerValue)
  } else {
    emit('confirm', res as PickerValue)
  }
  emit('finish')
}

const handleCancel = () => {
  emit('cancel')
  emit('finish')
}

const isSelected = (option: ValueType) => selected.value.has(option)

const handleSelect = (option: PickerItem<ValueType>) => {
  if (isSelected(option.value)) {
    selected.value.delete(option.value)
  } else {
    if (type === 'single') {
      selected.value.clear()
    }
    selected.value.add(option.value)
    option.onSelect?.({
      value: option.value,
      option,
      options,
      selected: [...selected.value].map((v) => toRaw(v)),
    })
  }
}

const handleSelectAll = () => {
  if (options.some((v) => !selected.value.has(v.value))) {
    options.forEach((v) => selected.value.add(v.value))
  } else {
    selected.value.clear()
  }
}
</script>

<template>
  <Transition name="slide-down" appear>
    <div class="gui-picker flex flex-col p-8 shadow rounded-8">
      <div class="font-bold px-4 py-8">{{ t(title) }}</div>

      <div class="flex-1 overflow-auto">
        <div
          v-for="(o, i) in options"
          :key="i"
          :style="{ background: o.background }"
          class="item my-4 py-8 px-8 break-all"
          @click="handleSelect(o)"
        >
          <div class="flex items-center justify-between leading-relaxed">
            <div class="font-bold">{{ t(o.label) }}</div>
            <Icon
              v-show="isSelected(o.value)"
              :size="26"
              icon="selected"
              color="var(--primary-color)"
              class="shrink-0"
            />
          </div>
          <div class="text-12 leading-relaxed" style="opacity: 0.7">{{ o.description }}</div>
        </div>
      </div>

      <div class="form-action gap-4">
        <Button v-if="type === 'multi'" type="text" size="small" @click="handleSelectAll">
          {{ t('common.selectAll') }}
        </Button>
        <Button type="text" size="small" class="mr-auto">
          {{ selected.size }} / {{ options.length }}
        </Button>
        <Button size="small" @click="handleCancel">{{ t('common.cancel') }}</Button>
        <Button size="small" type="primary" @click="handleConfirm">
          {{ t('common.confirm') }}
        </Button>
      </div>
    </div>
  </Transition>
</template>

<style lang="less" scoped>
.gui-picker {
  min-width: 340px;
  max-width: 60%;
  background: var(--toast-bg);

  .item {
    &:nth-child(odd) {
      background: var(--table-tr-odd-bg);
    }
    &:nth-child(even) {
      background: var(--table-tr-even-bg);
    }
  }
}
</style>
