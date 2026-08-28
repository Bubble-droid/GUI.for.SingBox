import type { InputProps, InputType } from '@/components/Input/types'

export interface PromptProps<T extends InputType = 'text'> {
  title: string
  initialValue?: string | number
  props: Omit<InputProps<T>, 'modelValue'>
}
