import { parse } from 'yaml'

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

const ResponseType = {
  JSON: 'JSON',
  TEXT: 'TEXT',
  YAML: 'YAML',
} as const

interface RequestOptions {
  base?: string
  bearer?: string
  timeout?: number
  responseType?: ResponseType
  beforeRequest?: () => void
}

export class Request {
  public base: string
  public bearer: string
  public timeout: number
  public responseType: string
  public beforeRequest: () => void

  constructor(options: RequestOptions = {}) {
    this.base = options.base ?? ''
    this.bearer = options.bearer ?? ''
    this.timeout = options.timeout ?? 10_000
    this.responseType = options.responseType ?? ResponseType.JSON
    this.beforeRequest = options.beforeRequest ?? (() => 0)
  }

  private readonly request = async <T>(
    url: string,
    options: { method: Method; body?: Record<string, any> },
  ) => {
    this.beforeRequest()

    const init: RequestInit = {
      method: options.method,
      signal: AbortSignal.timeout(this.timeout),
    }

    if (this.base) {
      url = this.base + url
    }

    if (this.bearer) {
      init.headers ??= {}
      Object.assign(init.headers, { Authorization: `Bearer ${this.bearer}` })
    }

    if (['GET'].includes(options.method)) {
      const query = new URLSearchParams(options.body ?? {}).toString()
      query && (url += `?${query}`)
    }

    if (['POST', 'PUT', 'PATCH'].includes(options.method)) {
      init.body = JSON.stringify(options.body ?? {})
    }

    const res = await fetch(url, init)

    if (res.status === 204) {
      return null as T
    }

    if ([504, 401, 503].includes(res.status)) {
      const { message } = (await res.json()) as { message: string }
      throw new Error(message)
    }

    if (this.responseType === ResponseType.TEXT) {
      const text = await res.text()
      return text as T
    }

    if (this.responseType === ResponseType.YAML) {
      const text = await res.text()
      return parse(text) as T
    }

    const json = (await res.json()) as T
    return json
  }

  public get = <T>(url: string, body = {}) => this.request<T>(url, { method: 'GET', body })
  public post = <T>(url: string, body = {}) => this.request<T>(url, { method: 'POST', body })
  public put = <T>(url: string, body = {}) => this.request<T>(url, { method: 'PUT', body })
  public patch = <T>(url: string, body = {}) => this.request<T>(url, { method: 'PATCH', body })
  public delete = <T>(url: string) => this.request<T>(url, { method: 'DELETE' })
}
