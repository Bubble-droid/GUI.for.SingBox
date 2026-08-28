import { Cron } from 'croner'
import { parse } from 'yaml'

import { normalizeBase64, normalizeErrorMessage } from './normalize'

export const isValidBase64 = (str: string) => {
  if (typeof str !== 'string') {
    return false
  }
  if (str === '' || str.trim() === '') {
    return false
  }

  // Accept URL-safe base64 and ignore line breaks/spaces in subscription responses.
  const normalized = normalizeBase64(str)
  try {
    atob(normalized)
    return true
  } catch {
    return false
  }
}

export const isValidSubYAML = (str: string) => {
  if (typeof str !== 'string') {
    return false
  }
  try {
    const { proxies } = parse(str) as { proxies?: unknown }
    return !!proxies
  } catch {
    return false
  }
}

export const isValidSubJson = (str: string) => {
  if (typeof str !== 'string') {
    return false
  }
  try {
    const { outbounds } = JSON.parse(str) as { outbounds?: unknown }
    return !!outbounds
  } catch {
    return false
  }
}

export const isValidPaylodYAML = (str: string) => {
  try {
    const { payload } = parse(str) as { payload?: unknown }
    return !!payload
  } catch {
    return false
  }
}

export const isValidRulesJson = (str: string) => {
  try {
    const { rules } = JSON.parse(str) as { rules?: unknown }
    return !!rules
  } catch {
    return false
  }
}

export const isValidUrl = (str: string) => {
  try {
    return !!new URL(str)
  } catch {
    return false
  }
}

export const isValidIPv4 = (ip: string) =>
  /^((25[0-5]|2[0-4]\d|[01]?\d\d?)\.){3}(25[0-5]|2[0-4]\d|[01]?\d\d?)$/u.test(ip)

const ipv6Segment = '[0-9a-fA-F]{1,4}'
const ipv4Octet = String.raw`(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)`
const ipv4Addr = `(${ipv4Octet}\\.){3}${ipv4Octet}`
const ipv6RegExp = new RegExp(
  `^(` +
    `(${ipv6Segment}:){7}${ipv6Segment}|` +
    `(${ipv6Segment}:){1,7}:|` +
    `(${ipv6Segment}:){1,6}:${ipv6Segment}|` +
    `(${ipv6Segment}:){1,5}(:${ipv6Segment}){1,2}|` +
    `(${ipv6Segment}:){1,4}(:${ipv6Segment}){1,3}|` +
    `(${ipv6Segment}:){1,3}(:${ipv6Segment}){1,4}|` +
    `(${ipv6Segment}:){1,2}(:${ipv6Segment}){1,5}|` +
    `${ipv6Segment}:((:${ipv6Segment}){1,6})|` +
    `:((:${ipv6Segment}){1,7}|:)|` +
    `fe80:(:[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]+|` +
    `::(ffff(:0{1,4})?:)?${ipv4Addr}|` +
    `(${ipv6Segment}:){6}${ipv4Addr}|` +
    `(${ipv6Segment}:){1,4}:${ipv4Addr}` +
    `)$`,
  'u',
)

export const isValidIPv6 = (ip: string) => ipv6RegExp.test(ip)

export const isValidJson = (str: string) => {
  try {
    return !!JSON.parse(str)
  } catch {
    return false
  }
}

export const isNumber = (v: any) => typeof v === 'number'

export const isValidCron = (pattern: string) => {
  try {
    const instance = new Cron(pattern, { paused: true })
    return { ok: true, reason: null, instance }
  } catch (error) {
    return { ok: false, reason: normalizeErrorMessage(error), instance: null }
  }
}
