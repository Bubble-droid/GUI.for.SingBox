import { isPlainObject } from '@/utils'

type FilterResult<T> = {
  [K in keyof T]-?: NonNullable<T[K]>
}

export const filterInvalidProps = <T extends object>(obj: T): FilterResult<T> => {
  const result: Recordable = {}

  for (const [key, value] of Object.entries(obj)) {
    if (!value) continue
    if (Array.isArray(value) && value.length === 0) continue
    if (isPlainObject(value) && Object.keys(value).length === 0) continue
    result[key] = value
  }

  return result as FilterResult<T>
}

export const ensureArray = <T>(value: T | T[] | null | undefined): T[] => {
  return value == null ? [] : Array.isArray(value) ? value : [value]
}
