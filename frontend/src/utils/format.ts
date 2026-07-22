import i18n from '@/lang'

import type { Recordable } from '@/types'

import { ensureArray } from './others'

export function formatBytes(bytes: number, decimals: number = 1): string {
  if (bytes === 0) return '0 B'

  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']

  const i = Math.max(0, Math.floor(Math.log(bytes) / Math.log(k)))
  const formattedValue = parseFloat((bytes / Math.pow(k, i)).toFixed(decimals))

  return `${formattedValue} ${sizes[i]}`
}

export function formatRelativeTime(d: string | number) {
  const formatter = new Intl.RelativeTimeFormat(i18n.global.locale.value, { numeric: 'auto' })
  const date = new Date(d)
  const now = Date.now()
  const diffMs = date.getTime() - now

  const isSameDay = formatDate(d, 'YYYY-MM-DD') === formatDate(now, 'YYYY-MM-DD')

  // now
  if (diffMs === 0) return formatter.format(0, 'second')

  const units: { unit: Intl.RelativeTimeFormatUnit; threshold: number }[] = [
    { unit: 'year', threshold: 365 * 24 * 60 * 60 * 1000 },
    { unit: 'month', threshold: 30 * 24 * 60 * 60 * 1000 },
    { unit: 'day', threshold: 24 * 60 * 60 * 1000 },
    { unit: 'hour', threshold: 60 * 60 * 1000 },
    { unit: 'minute', threshold: 60 * 1000 },
    { unit: 'second', threshold: 1000 },
  ]

  for (const { unit, threshold } of units) {
    if (unit === 'day' && isSameDay) continue
    const amount = Math.round(diffMs / threshold)
    if (Math.abs(amount) > 0) return formatter.format(amount, unit)
  }

  return formatter.format(Math.round(diffMs / 1000), 'second')
}

export function formatDate(timestamp: number | string, format: string) {
  const date = new Date(timestamp)

  const map: Record<string, any> = {
    YYYY: date.getFullYear(),
    MM: String(date.getMonth() + 1).padStart(2, '0'),
    DD: String(date.getDate()).padStart(2, '0'),
    HH: String(date.getHours()).padStart(2, '0'),
    mm: String(date.getMinutes()).padStart(2, '0'),
    ss: String(date.getSeconds()).padStart(2, '0'),
  }

  return format.replace(/YYYY|MM|DD|HH|mm|ss/g, (matched) => map[matched])
}

export function formatProxyHost(host: string) {
  return host.includes(':') && !host.startsWith('[') ? `[${host}]` : host
}

export const formatRecord = (record: Recordable) => {
  const children: string[] = []
  for (const [k, v] of Object.entries(record)) {
    let normalized = ''
    if (Array.isArray(v)) {
      normalized = v.join(', ')
    } else if (typeof v === 'object' && v !== null) {
      const inner = Object.entries(v)
        .map(([vk, vv]) => `${vk}=${ensureArray(vv).join(', ')}`)
        .join('; ')
      normalized = `[${inner}]`
    } else if (typeof v === 'boolean') {
      normalized = v ? 'True' : 'False'
    } else {
      normalized = String(v)
    }

    const formattedKey = k.charAt(0).toUpperCase() + k.slice(1)
    children.push(`${formattedKey}: ${normalized}`)
  }
  return children.join(' • ')
}
