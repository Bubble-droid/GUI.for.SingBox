import { ref } from 'vue'

export const IS_IN_MODAL = 'IS_IN_MODAL'

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
