import type { MaybePromise } from '@/types'

export interface ModalProps {
  title?: string | undefined
  footer?: boolean
  maxHeight?: string
  maxWidth?: string
  minWidth?: string
  minHeight?: string
  width?: string
  height?: string
  px?: number
  py?: number
  cancel?: boolean
  submit?: boolean
  cancelText?: string
  submitText?: string
  maskClosable?: boolean
  class?: string | undefined
  container?: string
  destroyOnClose?: boolean
  toolbar?: {
    maximize?: boolean
    minimize?: boolean
    close?: boolean
  }
  onOk?: (() => MaybePromise<boolean | void>) | undefined
  onCancel?: (() => MaybePromise<boolean | void>) | undefined
  beforeClose?: ((isOk: boolean) => MaybePromise<boolean | void>) | undefined
  afterClose?: ((isOk: boolean) => void) | undefined
  afterDestroy?: (() => void) | undefined
}

export interface ModalSlots {
  default?: (() => any) | undefined
  title?: (() => any) | undefined
  toolbar?: (() => any) | undefined
  action?: (() => any) | undefined
  cancel?: (() => any) | undefined
  submit?: (() => any) | undefined
}
