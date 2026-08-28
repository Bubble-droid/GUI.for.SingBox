export type InputType = 'number' | 'text' | 'code'

export type InputModelValue<T extends InputType = 'text'> = T extends 'number' ? number : string

export interface InputProps<T extends InputType = 'text'> {
  modelValue?: InputModelValue<T>
  modelModifiers?: {
    lazy?: boolean
    trim?: boolean
  }
  autoSize?: boolean
  placeholder?: string
  type?: T
  lang?: 'yaml' | 'json' | 'javascript'
  size?: 'default' | 'small'
  editable?: boolean
  clearable?: boolean
  allowPaste?: boolean
  autofocus?: boolean
  min?: number
  max?: number
  maxWidth?: boolean
  disabled?: boolean
  border?: boolean
  delay?: number
}
