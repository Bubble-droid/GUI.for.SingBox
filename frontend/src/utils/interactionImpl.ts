import { render, h, type VNode } from 'vue'

import i18n from '@/lang'

import ConfirmComp from '@/components/Confirm/index.vue'
import MessageComp from '@/components/Message/index.vue'
import { useModal } from '@/components/Modal'
import PickerComp from '@/components/Picker/index.vue'
import PromptComp from '@/components/Prompt/index.vue'
import ResourceSelectComp from '@/components/ResourceSelect/index.vue'
import { ResourceTypeMap } from '@/components/ResourceSelect/types'

import type { ConfirmOptions } from '@/components/Confirm/index.vue'
import type { InputProps } from '@/components/Input/types'
import type { MessageIcon } from '@/components/Message/index.vue'
import type { ModalProps, ModalSlots } from '@/components/Modal/types'
import type { PickerItem, PickerProps } from '@/components/Picker/types'
import type {
  ResourceResultMap,
  ResourceSelectProps,
  ResourceSelectType,
  ResourceTypeOf,
} from '@/components/ResourceSelect/types'

import { bindAppContext } from './appContext'
import { APP_TITLE } from './env'
import type { InteractionAPI, Message, MessageInstance, Picker } from './interaction'
import { normalizeErrorMessage } from './normalize'
import { sampleID } from './others'

const ContainerCssText = `
    position: fixed;
    z-index: 99999;
    top: 84px;
    left: 0;
    right: 0;
    display: flex;
    justify-content: center;
    max-height: 70%;
`

interface MessageEntry {
  dom: HTMLDivElement
  vnode: VNode
  timer: number
}

class MessageImpl implements Message {
  public container: HTMLElement
  public instances: Record<string, MessageEntry>

  constructor() {
    const ID = APP_TITLE + '-toast'
    this.container = document.querySelector(`#${ID}`) ?? document.createElement('div')
    this.container.id = ID
    this.container.style.cssText = `
        position: fixed;
        z-index: 999999;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
    `
    document.body.append(this.container)
    this.instances = {}
  }

  private buildMessage = (icon: MessageIcon) => {
    return (content: unknown, duration = 3_000, onClose?: () => void): MessageInstance => {
      const id = sampleID()
      const dom = document.createElement('div')

      const onMouseEnter = () => {
        clearTimeout(this.instances[id]!.timer)
      }
      const onMouseLeave = () => {
        this.instances[id]!.timer = setTimeout(onDestroy, duration)
      }

      const onDestroy = () => {
        dom.removeEventListener('mouseenter', onMouseEnter)
        dom.removeEventListener('mouseleave', onMouseLeave)
        this.destroy(id)
      }

      const initInstance = () => {
        dom.style.cssText = 'display: flex; align-items: center; justify-content: center;'

        const vnode = h(MessageComp, {
          icon,
          content: normalizeErrorMessage(content),
          onClose: () => {
            onClose?.()
            onDestroy()
          },
        })
        bindAppContext(vnode)

        this.instances[id] = {
          dom,
          vnode,
          timer: setTimeout(onDestroy, duration),
        }

        dom.addEventListener('mouseenter', onMouseEnter)
        dom.addEventListener('mouseleave', onMouseLeave)

        this.container.append(dom)
        render(vnode, dom)
      }

      initInstance()

      return {
        id,
        info: (newContent: unknown) => {
          this.update(id, newContent, 'info')
        },
        warn: (newContent: unknown) => {
          this.update(id, newContent, 'warn')
        },
        error: (newContent: unknown) => {
          this.update(id, newContent, 'error')
        },
        success: (newContent: unknown) => {
          this.update(id, newContent, 'success')
        },
        update: (nextContent: unknown, nextIcon?: MessageIcon) => {
          this.update(id, nextContent, nextIcon)
        },
        destroy: onDestroy,
      }
    }
  }

  public info = this.buildMessage('info')
  public warn = this.buildMessage('warn')
  public error = this.buildMessage('error')
  public success = this.buildMessage('success')

  public update = (id: string, content: unknown, icon?: MessageIcon) => {
    const instance = this.instances[id]
    if (instance) {
      icon && (instance.vnode.component!.props['icon'] = icon)
      content && (instance.vnode.component!.props['content'] = normalizeErrorMessage(content))
    }
  }

  public destroy = (id: string) => {
    const instance = this.instances[id]
    if (instance) {
      render(null, instance.dom)
      instance.dom.remove()
      clearTimeout(instance.timer)
      delete this.instances[id]
    }
  }
}

class PickerImpl implements Picker {
  public single = <T>(title: string, options: PickerItem<T>[], initialValue: T[] = []) => {
    return this.buildPicker('single', title, options, initialValue)
  }

  public multi = <T>(title: string, options: PickerItem<T>[], initialValue: T[] = []) => {
    return this.buildPicker('multi', title, options, initialValue)
  }

  public resource = <T extends ResourceSelectType>(
    type: T,
    title: string,
    options?: Partial<ResourceSelectProps<ResourceTypeOf<T>>>,
    initialValue?: string[],
  ): Promise<{ ids: string[]; items: ResourceResultMap[T][] }> => {
    return new Promise((resolve) => {
      const dom = document.createElement('div')
      // oxlint-disable-next-line typescript/no-unsafe-argument
      const vnode = h(ResourceSelectComp, {
        type: ResourceTypeMap[type],
        title,
        renderSlot: false,
        openImmediate: true,
        modelValue: initialValue ?? [],
        onSubmit(ids, items) {
          // oxlint-disable-next-line typescript/no-unsafe-assignment
          resolve({ ids, items: items as ResourceResultMap[T][] })
          render(null, dom)
          dom.remove()
        },
        ...options,
      })
      bindAppContext(vnode)
      document.body.append(dom)
      render(vnode, dom)
    })
  }

  private buildPicker = <ValueType, PickerType extends 'single' | 'multi'>(
    type: PickerType,
    title: string,
    options: PickerItem<ValueType>[],
    initialValue: ValueType[],
  ): Promise<PickerType extends 'single' ? ValueType : ValueType[]> => {
    return new Promise((resolve, reject) => {
      const { t } = i18n.global
      const dom = document.createElement('div')
      dom.style.cssText = ContainerCssText
      const vnode = h(PickerComp as any, {
        type,
        title,
        options,
        initialValue,
        onConfirm: resolve,
        onCancel: () => {
          reject(new Error(t('common.canceled')))
        },
        onFinish: () => {
          render(null, dom)
          dom.remove()
        },
      } satisfies PickerProps<ValueType, PickerType>)
      bindAppContext(vnode)
      document.body.append(dom)
      render(vnode, dom)
    })
  }
}

const buildConfirm = (title: string, message: string, options?: ConfirmOptions, cancel = true) => {
  return new Promise((resolve, reject) => {
    const { t } = i18n.global
    const dom = document.createElement('div')
    dom.style.cssText = ContainerCssText
    const vnode = h(ConfirmComp, {
      title,
      message,
      options: { type: 'text', ...options },
      cancel,
      onConfirm: resolve,
      onCancel: () => {
        reject(new Error(t('common.canceled')))
      },
      onFinish: () => {
        render(null, dom)
        dom.remove()
      },
    })
    bindAppContext(vnode)
    document.body.append(dom)
    render(vnode, dom)
  })
}

const prompt = <T>(
  title: string,
  initialValue: string | number = '',
  props: Partial<InputProps> = {},
) => {
  const { t } = i18n.global

  return new Promise<T>((resolve, reject) => {
    const dom = document.createElement('div')
    dom.style.cssText = ContainerCssText
    // oxlint-disable-next-line typescript/no-unsafe-argument
    const vnode = h(PromptComp, {
      title,
      initialValue,
      props,
      onSubmit: resolve,
      onCancel: () => {
        reject(new Error(t('common.canceled')))
      },
      onFinish: () => {
        render(null, dom)
        dom.remove()
      },
    })
    bindAppContext(vnode)
    document.body.append(dom)
    render(vnode, dom)
  })
}

const alert = (title: string, message: string, options?: ConfirmOptions) => {
  return buildConfirm(title, message, { type: 'text', ...options }, false)
}

const confirm = (title: string, message: string, options?: ConfirmOptions) => {
  return buildConfirm(title, message, { type: 'text', ...options })
}

const modal = (options: ModalProps = {}, slots: ModalSlots = {}) => {
  const id = 'Modal-' + sampleID()

  const container = document.createElement('div')
  container.id = id
  container.dataset['title'] = options.title
  document.body.append(container)

  const [Modal, api] = useModal(
    {
      ...options,
      container: '#' + id,
      afterDestroy() {
        options.afterDestroy?.()
        render(null, container)
        container.remove()
      },
    },
    slots,
  )
  const vnode = h(Modal)
  bindAppContext(vnode)

  render(vnode, container)

  return api
}

export const createInteractionAPI = (): InteractionAPI => {
  return {
    message: new MessageImpl(),
    picker: new PickerImpl(),
    prompt,
    alert,
    confirm,
    modal,
  }
}
