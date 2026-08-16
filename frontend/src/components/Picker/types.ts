export interface PickerItem<T> {
  label: string
  value: T
  description?: string
  background?: string
  onSelect?: (args: {
    value: PickerItem<T>['value']
    option: PickerItem<T>
    options: PickerItem<T>[]
    selected: PickerItem<T>['value'][]
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
