type Recordable<T = any> = { [x: string]: T }

type MaybePromise<T> = T | Promise<T>

type BuiltIn =
  | ((...args: never[]) => unknown)
  | Date
  | RegExp
  | Error
  | Map<unknown, unknown>
  | Set<unknown>

type Prettify<T> = T extends BuiltIn ? T : T extends object ? { [K in keyof T]: T[K] } & {} : T

type UnpackArray<T> = T extends readonly (infer U)[] ? U : T

type StrictRequired<T> = {
  [P in keyof T]-?: NonNullable<T[P]>
}

type ValueOf<T> = T[keyof T]
