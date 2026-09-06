export interface PickerItem<T> {
  label: string
  value: T
  description?: string
  background?: string
  onSelect?: (args: {
    value: T
    option: PickerItem<T>
    options: PickerItem<T>[]
    selected: T[]
  }) => void
}

export interface PickerProps<T, K> {
  type: K
  title: string
  options?: PickerItem<T>[]
  initialValue?: T[]
  onConfirm?: (val: K extends 'single' ? T : T[]) => void
  onCancel?: () => void
  onFinish?: () => void
}
