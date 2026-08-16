import type { InputProps } from '../Input/types'

export interface PromptProps {
  title: string
  initialValue?: string | number
  props: Omit<InputProps, 'modelValue'>
}
