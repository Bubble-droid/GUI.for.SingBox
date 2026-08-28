import type { ConfirmOptions } from '@/components/Confirm/index.vue'
import type { InputProps } from '@/components/Input/types'
import type { MessageIcon } from '@/components/Message/index.vue'
import type { useModal } from '@/components/Modal'
import type { ModalProps, ModalSlots } from '@/components/Modal/types'
import type { PickerItem } from '@/components/Picker/types'
import type {
  ResourceResultMap,
  ResourceSelectProps,
  ResourceSelectType,
  ResourceTypeOf,
} from '@/components/ResourceSelect/types'

export interface MessageInstance {
  id: string
  info: (content: unknown) => void
  warn: (content: unknown) => void
  error: (content: unknown) => void
  success: (content: unknown) => void
  update: (content: unknown, icon?: MessageIcon) => void
  destroy: () => void
}

export interface Message {
  info: (content: unknown, duration?: number, onClose?: () => void) => MessageInstance
  warn: (content: unknown, duration?: number, onClose?: () => void) => MessageInstance
  error: (content: unknown, duration?: number, onClose?: () => void) => MessageInstance
  success: (content: unknown, duration?: number, onClose?: () => void) => MessageInstance
}

export interface Picker {
  single: <T>(title: string, options: PickerItem<T>[], initialValue?: T[]) => Promise<T>
  multi: <T>(title: string, options: PickerItem<T>[], initialValue?: T[]) => Promise<T[]>
  resource: <T extends ResourceSelectType>(
    type: T,
    title: string,
    options?: Partial<ResourceSelectProps<ResourceTypeOf<T>>>,
    initialValue?: string[],
  ) => Promise<{ ids: string[]; items: ResourceResultMap[T][] }>
}

export type ModalAPI = ReturnType<typeof useModal>[1]

export interface InteractionAPI {
  message: Message
  picker: Picker
  prompt: <T>(
    title: string,
    initialValue?: string | number,
    props?: Partial<InputProps>,
  ) => Promise<T>
  alert: (title: string, message: string, options?: ConfirmOptions) => Promise<unknown>
  confirm: (title: string, message: string, options?: ConfirmOptions) => Promise<unknown>
  modal: (options?: ModalProps, slots?: ModalSlots) => ModalAPI
}

const createInteraction = () => {
  let impl: InteractionAPI | null = null

  const registerInteractionAPI = (api: InteractionAPI) => {
    impl = api
  }

  const requireImpl = (): InteractionAPI => {
    if (!impl) {
      throw new Error('interaction API has not been registered yet')
    }
    return impl
  }

  const prompt = <T>(
    title: string,
    initialValue: string | number = '',
    props: Partial<InputProps> = {},
  ): Promise<T> => {
    return requireImpl().prompt<T>(title, initialValue, props)
  }

  const alert = (title: string, message: string, options?: ConfirmOptions): Promise<unknown> => {
    return requireImpl().alert(title, message, { type: 'text', ...options })
  }

  const confirm = (title: string, message: string, options?: ConfirmOptions): Promise<unknown> => {
    return requireImpl().confirm(title, message, { type: 'text', ...options })
  }

  const modal = (options: ModalProps = {}, slots: ModalSlots = {}): ModalAPI => {
    return requireImpl().modal(options, slots)
  }

  const message = new Proxy<Message>({} as Message, {
    get: (_target, prop) => requireImpl().message[prop as keyof Message],
  })

  const picker = new Proxy<Picker>({} as Picker, {
    get: (_target, prop) => requireImpl().picker[prop as keyof Picker],
  })

  return { message, picker, prompt, alert, confirm, modal, registerInteractionAPI }
}

export const { message, picker, prompt, alert, confirm, modal, registerInteractionAPI } =
  createInteraction()
