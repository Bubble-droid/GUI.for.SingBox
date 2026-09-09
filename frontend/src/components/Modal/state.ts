import { ref } from 'vue'
import type { InjectionKey } from 'vue'

export const IS_IN_MODAL: InjectionKey<boolean> = Symbol('IS_IN_MODAL')
export const MODAL_CANCEL: InjectionKey<() => Promise<void>> = Symbol('MODAL_CANCEL')
export const MODAL_SUBMIT: InjectionKey<() => Promise<void>> = Symbol('MODAL_SUBMIT')

export interface MinimizedModal {
  id: string
  title: () => string
  openFn: () => void
  closeFn: () => void
  minimizeFn: () => void
}

export const modalStack: (() => void)[] = []
export const modalZIndexCounter = ref(999)
export const modalMinimized = ref<MinimizedModal[]>([])
