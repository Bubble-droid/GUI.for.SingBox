import type { typebox } from '@zhexin/typebox'

export type { log as SingBoxLogConfig } from '@zhexin/typebox/log'
export type { experimental as SingBoxExperimental } from '@zhexin/typebox/experimental'

export type SingBoxConfig = typebox<
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string
>
