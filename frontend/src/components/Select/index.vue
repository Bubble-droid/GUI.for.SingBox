<script setup lang="ts" generic="T extends SelectModelValue = string, M extends boolean = false">
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { deepClone } from '@/utils/others'

import type { SelectModelValue, SelectProps, SelectValueType } from './types'

type ModelValue = SelectValueType<T, M>

const props = withDefaults(defineProps<SelectProps<T, M>>(), {
  modelValue: undefined,
  options: () => [],
  multiple: false as any,
  border: true,
  size: 'default',
  placeholder: '',
  autoSize: false,
  clearable: false,
})

const emit = defineEmits<{
  changed: [value: ModelValue]
  'update:modelValue': [value: ModelValue]
}>()

const model = ref<T | T[] | undefined>(
  props.multiple ? deepClone((props.modelValue as T[]) ?? []) : (props.modelValue as T | undefined),
)

const { t } = useI18n()

const innerClearable = computed(() => {
  if (!props.clearable) {
    return false
  }
  if (props.multiple) {
    return Array.isArray(model.value) && model.value.length > 0
  }
  return model.value !== undefined && model.value !== null && model.value !== ''
})

const optionsValueLabelMapping = computed(() =>
  props.options.reduce<Record<SelectModelValue, SelectModelValue>>((p, c) => {
    p[c.value] = c.label ?? c.value
    return p
  }, {}),
)

const displayLabel = computed(() => {
  if (props.multiple) {
    const selected = (Array.isArray(model.value) ? model.value : []) as T[]
    if (selected.length === 0) {
      return props.placeholder || 'common.none'
    }
    return selected
      .map((item) => t(String(optionsValueLabelMapping.value[item] ?? item)))
      .join('、')
  }
  const option = props.options.find((v) => v.value === model.value)
  const label = option ? (option.label ?? option.value) : model.value
  if (label !== undefined && label !== null && label !== '') {
    return String(label)
  }
  return props.placeholder || 'common.none'
})

let internalUpdate = false

watch(
  () => props.modelValue,
  (val) => {
    if (!internalUpdate) {
      model.value = props.multiple ? deepClone(val ?? []) : val
    }
    internalUpdate = false
  },
  { deep: true },
)

const isSelected = (val: T) => {
  if (props.multiple) {
    return Array.isArray(model.value) && model.value.includes(val)
  }
  return model.value === val
}

const handleSelect = (value: T) => {
  const oldModel = JSON.stringify(model.value)
  if (props.multiple) {
    if (!Array.isArray(model.value)) {
      model.value = []
    }
    const list = model.value as T[]
    const idx = list.indexOf(value)
    if (idx === -1) {
      list.push(value)
    } else {
      list.splice(idx, 1)
    }
    if (oldModel !== JSON.stringify(model.value)) {
      emit('update:modelValue', model.value)
      emit('changed', model.value)
    }
  } else if (value !== model.value) {
    model.value = value
    emit('update:modelValue', model.value)
    emit('changed', model.value)
  }
  internalUpdate = true
}

const handleClear = () => {
  if (props.multiple) {
    model.value = []
    emit('update:modelValue', [] as unknown as ModelValue)
    emit('changed', [] as unknown as ModelValue)
  } else {
    model.value = ''
    emit('update:modelValue', '' as ModelValue)
    emit('changed', '' as ModelValue)
  }
  internalUpdate = true
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
              !props.multiple && close()
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
