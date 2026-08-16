export interface InputProps {
  modelValue?: string | number | undefined
  modelModifiers?: {
    lazy?: boolean
    trim?: boolean
    [key: string]: boolean | undefined
  }
  autoSize?: boolean
  placeholder?: string | undefined
  type?: 'number' | 'text' | 'code'
  lang?: 'yaml' | 'json' | 'javascript'
  size?: 'default' | 'small'
  editable?: boolean
  clearable?: boolean
  allowPaste?: boolean
  autofocus?: boolean
  min?: number | undefined
  max?: number | undefined
  maxWidth?: boolean
  disabled?: boolean
  border?: boolean
  delay?: number
}
