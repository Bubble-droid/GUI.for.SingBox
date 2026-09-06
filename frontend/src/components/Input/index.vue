<script setup lang="ts" generic="T extends InputType = 'text'">
import { computed, nextTick, onMounted, ref, useTemplateRef } from 'vue'

import { ClipboardGetText } from '@wails/runtime/runtime'

import useI18n from '@/lang'
import { debounce } from '@/utils/others'

import type { InputModelValue, InputProps, InputType } from './types'

type ValueType = InputModelValue<T>

const [modelValue, modifiers] = defineModel<ValueType, 'lazy' | 'trim'>({
  required: true,
  set(val) {
    if (typeof val === 'string' && modifiers.trim) {
      return val.trim()
    }
    return val
  },
})

const {
  type = 'text',
  lang = 'javascript',
  size = 'default',
  editable,
  autofocus,
  allowPaste,
  min,
  max,
  maxWidth = true,
  clearable,
  disabled,
  border = true,
  delay = 0,
} = defineProps<InputProps<T>>()

const emit = defineEmits<{
  changed: [value: ValueType]
  confirm: [value: ValueType]
}>()

const showEdit = ref(false)
const isComposing = ref(false)
const inputRef = useTemplateRef('inputRef')

const innerClearable = computed(() => clearable && type !== 'code' && modelValue.value && !disabled)
const innerAllowPaste = computed(() => allowPaste && type !== 'code' && !disabled)

const { t } = useI18n.global

const validate = (val: string | number): ValueType => {
  if (type === 'number') {
    let num = Number(val)
    if (Number.isNaN(num)) {
      throw new TypeError('Please enter a valid number')
    }
    if (min !== undefined) {
      num = num < min ? min : num
    }
    if (max !== undefined) {
      num = num > max ? max : num
    }
    return num as ValueType
  }
  return String(val) as ValueType
}

type InputPayload =
  | InputEvent
  | {
      target: { value: string | number }
    }

const emitInput = debounce((e: InputPayload) => {
  if (!e.target || !('value' in e.target)) {
    return
  }
  modelValue.value = validate(e.target.value)
  e.target.value = modelValue.value
  emit('changed', modelValue.value)
}, delay)

const onInput = (e: InputPayload) => {
  if (isComposing.value || ('isComposing' in e && e.isComposing)) {
    return
  }
  if (modifiers.lazy) {
    return
  }
  emitInput(e)
}

const onCompositionStart = () => {
  isComposing.value = true
  emitInput.cancel()
}

const onCompositionEnd = (e: CompositionEvent) => {
  isComposing.value = false
  emitInput(e)
}

const onKeydownEnter = async (e: KeyboardEvent) => {
  if (isComposing.value || e.isComposing || e.keyCode === 229) {
    return
  }
  await nextTick()
  inputRef.value?.blur()
}

const handleClear = async () => {
  const val = (type === 'number' ? Math.min(min || 0, 0) : '') as ValueType
  modelValue.value = val
  emit('changed', modelValue.value)
  if (!editable) {
    await nextTick()
    inputRef.value?.focus()
  }
}

const handlePaste = async () => {
  const text = await ClipboardGetText()
  modelValue.value = validate(text)
  emit('changed', modelValue.value)
}

const showInput = async () => {
  if (disabled) {
    return
  }
  showEdit.value = true
  await nextTick()
  inputRef.value?.focus()
}

const onSubmit = (e: FocusEvent) => {
  emitInput.cancel()

  const target = e.target as HTMLInputElement
  const val = validate(target.value)

  const hasChanged = modelValue.value !== val
  modelValue.value = val

  if (hasChanged || modifiers.lazy) {
    emit('changed', modelValue.value)
  }

  target.value = String(modelValue.value ?? '')

  emit('confirm', modelValue.value)
  if (editable) {
    showEdit.value = false
  }
}

onMounted(() => autofocus && !editable && inputRef.value?.focus())

defineExpose({
  focus: () => inputRef.value?.focus(),
})
</script>

<template>
  <div
    v-bind="$attrs"
    :class="{
      border: border && (!editable || showEdit),
      'auto-size': autoSize,
      'bg-color': !editable || showEdit,
      'is-editable': editable && !showEdit,
      'no-max-width': !maxWidth,
      [size]: true,
      disabled,
    }"
    :style="{
      height: type === 'code' ? '' : size === 'small' ? '26px' : '30px',
    }"
    class="gui-input inline-flex items-center rounded-4 cursor-pointer px-4"
  >
    <div v-if="$slots.prefix" class="flex items-center shrink-0">
      <slot name="prefix" v-bind="{ showInput }"></slot>
    </div>
    <Icon v-if="disabled" icon="forbidden" class="shrink-0" />
    <div
      v-if="editable && !showEdit"
      class="w-full overflow-hidden whitespace-nowrap text-ellipsis"
      :class="{ 'italic pr-4': !modelValue }"
      @click="showInput"
    >
      <slot name="editable" v-bind="{ value: modelValue }">
        {{ modelValue || t(placeholder || 'common.none') }}
      </slot>
    </div>
    <template v-else>
      <CodeEditor
        v-if="type === 'code'"
        :model-value="String(modelValue ?? '')"
        :lang="lang"
        :editable="!disabled"
        :placeholder="placeholder"
        class="code w-full overflow-y-auto"
        @change="(value: string) => onInput({ target: { value } })"
      />
      <input
        v-else
        ref="inputRef"
        :value="modelValue"
        :placeholder="placeholder"
        :type="type"
        :disabled="disabled"
        autocomplete="off"
        class="flex-1 inline-block py-6 outline-none border-0 bg-transparent w-0"
        @input="onInput"
        @compositionstart="onCompositionStart"
        @compositionend="onCompositionEnd"
        @blur="onSubmit"
        @keydown.enter="onKeydownEnter"
        @keydown.esc.stop.prevent="inputRef?.blur()"
      />
      <Button
        v-if="innerClearable"
        icon="clear2"
        type="text"
        size="small"
        @mousedown.prevent
        @click="handleClear"
      />
      <Button v-if="innerAllowPaste" icon="paste" type="text" size="small" @click="handlePaste" />
    </template>
    <div v-if="$slots.suffix" class="flex items-center shrink-0">
      <slot name="suffix" v-bind="{ showInput }"></slot>
    </div>
  </div>
</template>

<style lang="less" scoped>
.gui-input {
  min-width: 220px;
  border: 1px solid transparent;
  input {
    color: var(--input-color);
  }
  .code {
    max-height: 300px;
  }
}

.bg-color {
  background: var(--input-bg);
}

.is-editable {
  min-width: 0;
}

.is-editable:not(.no-max-width) {
  max-width: 220px;
}

.auto-size {
  min-width: 0 !important;
}

.disabled {
  cursor: not-allowed;
  input {
    cursor: not-allowed;
  }
}

.border {
  border: 1px solid var(--primary-color);
}

.small {
  input {
    font-size: 12px;
  }
}
</style>
