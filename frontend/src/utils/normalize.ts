export const normalizeProxyHost = (host: string) => {
  if (!host || ['0.0.0.0', '::', '[::]'].includes(host)) {
    return '127.0.0.1'
  }
  return host
}

export const normalizeRequestProxy = (proxy: string) => {
  const trimmed = proxy.trim()
  if (!trimmed) return ''
  if (/^[a-z][a-z\d+\-.]*:\/\//i.test(trimmed)) return trimmed
  return `http://${trimmed}`
}

export const normalizeErrorMessage = (error: unknown) => {
  if (typeof error === 'string') return error
  if (error instanceof Error) return error.message
  return String(error)
}

export const normalizeBase64 = (str: string): string => {
  const normalized = str.trim().replace(/\s+/g, '').replace(/-/g, '+').replace(/_/g, '/')

  const padding = (4 - (normalized.length % 4)) % 4
  return normalized + '='.repeat(padding)
}
