export type Recordable<T = any> = Record<string, T>

export type MaybePromise<T> = T | Promise<T>

type BuiltIn =
  | ((...args: never[]) => unknown)
  | Date
  | RegExp
  | Error
  | Map<unknown, unknown>
  | Set<unknown>

export type Prettify<T> = T extends BuiltIn
  ? T
  : T extends object
    ? { [K in keyof T]: T[K] } & {}
    : T

export type UnpackArray<T> = T extends readonly (infer U)[] ? U : T

export type ValueOf<T> = T[keyof T]

export type Listable<T> = T | T[]

type ResolveListable<V> =
  Exclude<V, null | undefined> extends infer U
    ? [Extract<U, unknown[]>] extends [infer Arr extends unknown[]]
      ? [Exclude<U, unknown[]>] extends [infer Item]
        ? [Item] extends [never]
          ? V
          : [Item[]] extends [Arr]
            ? [Arr] extends [Item[]]
              ? Arr | Extract<V, null | undefined>
              : V
            : V
        : V
      : V
    : V

export type NormalizeListableProps<Obj extends object> = {
  [K in keyof Obj]: ResolveListable<Obj[K]>
}

export type ExpandByProperty<T, K extends keyof T> = {
  [V in T[K] & PropertyKey]: {
    [P in keyof T]: P extends K ? V : T[P]
  }
}[T[K] & PropertyKey]

export type Entries<T> = {
  [K in keyof T]-?: [K, T[K]]
}[keyof T][]
