// oxlint-disable typescript/no-empty-interface
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type zh from './locale/zh'

export type MessageSchema = typeof zh

declare module 'vue-i18n' {
  interface DefineLocaleMessage extends MessageSchema {}
}
