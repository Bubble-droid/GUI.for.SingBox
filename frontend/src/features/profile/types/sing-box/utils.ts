import type { UnpackArray } from '@/types/utils'

export type ItemOf<T> = UnpackArray<NonNullable<T>>

export type Discriminated<T> = Extract<T, { type: unknown }>

export type ByType<
  Union extends { type?: unknown },
  T extends NonNullable<Union['type']>,
> = Extract<Union, { type?: T }>

export type ByAction<
  Union extends { action?: unknown },
  A extends NonNullable<Union['action']>,
> = Extract<Union, { action?: A }>
