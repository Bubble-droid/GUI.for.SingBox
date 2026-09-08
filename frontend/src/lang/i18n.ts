import type zh from './locale/zh'

export type MessageSchema = typeof zh

declare module 'vue-i18n' {
  interface DefineLocaleMessage extends MessageSchema {}
}
