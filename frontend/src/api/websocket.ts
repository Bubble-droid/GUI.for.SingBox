interface WebSocketsOptions {
  base?: string
  bearer?: string
  beforeConnect?: () => void
}

interface Options {
  url: string
  cb: (data: any) => void
  params?: Record<string, any> | undefined
}

export class WebSockets {
  public base: string
  public bearer: string
  public beforeConnect: () => void

  constructor(options: WebSocketsOptions) {
    this.base = options.base ?? ''
    this.bearer = options.bearer ?? ''
    this.beforeConnect = options.beforeConnect ?? (() => 0)
  }

  public createWS(options: Options) {
    this.beforeConnect()

    const params = { ...options.params, token: this.bearer }
    const query = new URLSearchParams(params).toString()
    const url = query ? `${options.url}?${query}` : options.url

    let isManualClose = false
    let ws: WebSocket | null = null
    let onMessage: ((e: MessageEvent) => void) | null = null
    let onClose: ((e: CloseEvent) => void) | null = null

    const connect = () => {
      ws = new WebSocket(this.base + url)
      onMessage = (e) => {
        options.cb(JSON.parse(e.data as string))
      }
      onClose = () => {
        setTimeout(() => {
          if (!isManualClose) {
            setTimeout(connect, 3000)
          }
        }, 1000)
      }
      ws.addEventListener('message', onMessage)
      ws.addEventListener('close', onClose)
    }

    const disconnect = () => {
      isManualClose = true
      if (ws) {
        if (onMessage) ws.removeEventListener('message', onMessage)
        if (onClose) ws.removeEventListener('close', onClose)
        onMessage = null
        onClose = null
        ws.close()
        ws = null
      }
    }

    return { connect, disconnect }
  }
}
