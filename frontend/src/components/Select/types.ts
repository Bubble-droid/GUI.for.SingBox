import type { ComponentOption } from '@/types/views'

export type SelectModelValue = string | number

export type SelectValueType<
  T extends SelectModelValue = string,
  M extends boolean = false,
> = M extends true ? T[] : T

export interface SelectProps<T extends SelectModelValue = string, M extends boolean = false> {
  modelValue?: SelectValueType<T, M>
  options?: ComponentOption<T>[]
  multiple?: M
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
  clearable?: boolean
}
