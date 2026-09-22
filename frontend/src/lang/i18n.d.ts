/* eslint-disable @typescript-eslint/no-empty-object-type */
import type zh from './locale/zh'

type MessageSchema = typeof zh

declare module 'vue-i18n' {
  interface DefineLocaleMessage extends MessageSchema {}
}
