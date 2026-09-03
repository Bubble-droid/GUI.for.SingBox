import type { Recordable } from '@/types/typescript'

const isPlainObject = (val: unknown): val is Record<PropertyKey, unknown> => {
  if (typeof val !== 'object' || val === null) {
    return false
  }
  const proto = Object.getPrototypeOf(val)
  return proto === null || proto === Object.prototype
}

const isInvalid = (val: unknown): boolean => {
  if (!val) {
    return true
  }
  if (Array.isArray(val)) {
    return val.length === 0
  }
  if (isPlainObject(val)) {
    return Object.keys(val).length === 0
  }
  return false
}

const cleanValue = (val: unknown, deep: boolean): unknown => {
  if (!deep) {
    return val
  }

  if (Array.isArray(val)) {
    return val.map((item) => cleanValue(item, true)).filter((item) => !isInvalid(item))
  }

  if (isPlainObject(val)) {
    const cleanedObj: Record<string, unknown> = {}
    for (const [key, item] of Object.entries(val)) {
      const cleanedItem = cleanValue(item, true)
      if (!isInvalid(cleanedItem)) {
        cleanedObj[key] = cleanedItem
      }
    }
    return cleanedObj
  }

  return val
}

export const cleanObject = <T extends object>(target: T, deep = false): Partial<T> => {
  if (!target || typeof target !== 'object') {
    return target
  }

  if (Array.isArray(target)) {
    const result = target
      .map((item) => (deep ? cleanValue(item, true) : item))
      .filter((item) => !isInvalid(item))
    return result as unknown as Partial<T>
  }

  const result: Record<string, unknown> = {}

  for (const [key, value] of Object.entries(target)) {
    const processedVal = deep ? cleanValue(value, true) : value
    if (!isInvalid(processedVal)) {
      result[key] = processedVal
    }
  }

  return result as Partial<T>
}

type Many<T> = T | readonly T[]

export const normalizeArray = <T>(value: Many<T> | null | undefined): T[] => {
  if (value == null) {
    return []
  }
  return Array.isArray(value) ? value : [value as T]
}

interface SplitResult<T, M> {
  target: Pick<T, Extract<keyof T, keyof M>>
  rest: Omit<T, keyof M>
}

export const splitProps = <T extends object, M extends object>(
  obj: T,
  template: M,
): SplitResult<T, M> => {
  const target: Recordable = {}
  const rest: Recordable = {}

  for (const [key, value] of Object.entries(obj)) {
    if (Object.hasOwn(template, key)) {
      target[key] = value
    } else {
      rest[key] = value
    }
  }

  return { target, rest } as SplitResult<T, M>
}
