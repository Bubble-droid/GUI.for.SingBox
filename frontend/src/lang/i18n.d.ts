import type zh from './locale/zh'

type MessageSchema = typeof zh

declare module 'vue-i18n' {
  export interface DefineLocaleMessage extends MessageSchema {}
}
