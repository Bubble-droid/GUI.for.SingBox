import type { OptionItem } from '@/types/component'

export type SelectModelValue = string | number

export type SelectValueType<
  T extends SelectModelValue = string,
  M extends boolean = false,
> = M extends true ? T[] : T

export interface SelectProps<T extends SelectModelValue = string, M extends boolean = false> {
  options?: OptionItem<T>[]
  multiple?: M
  border?: boolean
  size?: 'default' | 'small'
  placeholder?: string
  autoSize?: boolean
  clearable?: boolean
}
