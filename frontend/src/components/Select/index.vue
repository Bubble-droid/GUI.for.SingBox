<script setup lang="ts" generic="T extends SelectModelValue = string, M extends boolean = false">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import type { SelectModelValue, SelectProps, SelectValueType } from './types'

type ModelValue = SelectValueType<T, M>

const model = defineModel<ModelValue>({ required: true })

const {
  options = [],
  multiple,
  border = true,
  size = 'default',
  placeholder = '',
  clearable,
} = defineProps<Omit<SelectProps<T, M>, 'modelValue'>>()

const emit = defineEmits<{
  changed: [value: ModelValue]
}>()

const { t } = useI18n()

const innerClearable = computed(() => {
  if (!clearable) {
    return false
  }
  if (multiple) {
    return Array.isArray(model.value) && model.value.length > 0
  }
  return model.value !== undefined && model.value !== null && model.value !== ''
})

const optionsValueLabelMapping = computed(() =>
  options.reduce<Record<SelectModelValue, SelectModelValue>>((p, c) => {
    p[c.value] = c.label ?? c.value
    return p
  }, {}),
)

const displayLabel = computed(() => {
  if (multiple) {
    const selected = (Array.isArray(model.value) ? model.value : []) as T[]
    if (selected.length === 0) {
      return placeholder || 'common.none'
    }
    return selected
      .map((item) => t(String(optionsValueLabelMapping.value[item] ?? item)))
      .join('、')
  }
  const option = options.find((v) => v.value === model.value)
  const label = option ? (option.label ?? option.value) : model.value
  if (label !== undefined && label !== null && label !== '') {
    return String(label)
  }
  return placeholder || 'common.none'
})

const isSelected = (val: T) => {
  if (multiple) {
    return Array.isArray(model.value) && model.value.includes(val)
  }
  return model.value === val
}

const handleSelect = (value: T) => {
  if (multiple) {
    const list = Array.isArray(model.value) ? [...model.value] : []
    const idx = list.indexOf(value)
    if (idx === -1) {
      list.push(value)
    } else {
      list.splice(idx, 1)
    }
    model.value = list as ModelValue
    emit('changed', list as ModelValue)
  } else if (model.value !== value) {
    model.value = value as ModelValue
    emit('changed', value as ModelValue)
  }
}

const handleClear = () => {
  const emptyValue = (multiple ? [] : '') as unknown as ModelValue
  model.value = emptyValue
  emit('changed', emptyValue)
}
</script>

<template>
  <Dropdown :trigger="['click']">
    <template #default="{ toggle, close }">
      <div
        :class="{
          border,
          [size]: true,
          'auto-size': autoSize,
          'min-h-28': size === 'small',
          'min-h-30': size === 'default',
        }"
        class="gui-select cursor-pointer inline-flex items-center min-w-128 rounded-4 px-8"
      >
        <span class="line-clamp-1 break-all">
          {{ t(displayLabel) }}
        </span>
        <Button
          :icon="innerClearable ? 'close' : 'arrowDown'"
          type="text"
          size="small"
          class="ml-auto"
          style="margin-right: -6px"
          @click.stop="
            () => {
              if (innerClearable) {
                handleClear()
                close()
              } else {
                toggle()
              }
            }
          "
        />
      </div>
    </template>

    <template #overlay="{ close }">
      <div class="flex flex-col gap-4 min-w-64 p-4">
        <slot v-if="options.length === 0" name="empty">
          <Empty :icon-size="42" />
        </slot>
        <Button
          v-for="o in options"
          :key="o.value"
          type="text"
          @click="
            () => {
              handleSelect(o.value)
              !multiple && close()
            }
          "
        >
          <div class="relative w-full">
            <div v-if="isSelected(o.value)" class="absolute left-8">
              <Icon icon="selected" :size="18" />
            </div>
            <div>
              {{ t(o.label ?? String(o.value)) }}
            </div>
          </div>
        </Button>
      </div>
    </template>
  </Dropdown>
</template>

<style lang="less" scoped>
.gui-select {
  background: var(--select-bg);
}

.auto-size {
  width: 100%;
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  font-size: 12px;
}
</style>
