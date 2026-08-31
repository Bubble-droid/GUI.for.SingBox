import * as Bridge from '@wails/go/bridge/App'
import { EventsOn, EventsEmit, EventsOff } from '@wails/runtime/runtime'

import { normalizeErrorMessage } from '@/utils/normalize'

import type { Recordable } from '@/types'

interface Request {
  id: string
  method: string
  url: string
  headers: Record<string, string>
  body: string
}

interface Response {
  status: number
  headers: Record<string, string>
  body: string
  options: { mode: 'Binary' | 'Text' }
}

interface ServerOptions {
  Cert?: string
  Key?: string
  StaticPath?: string
  StaticRoute?: string
  StaticHeaders?: Recordable
  UploadPath?: string
  UploadRoute?: string
  UploadHeaders?: Recordable
  MaxUploadSize?: number
}

type HttpServerHandler = (
  req: Request,
  res: {
    end: (
      status: Response['status'],
      headers: Response['headers'],
      body: Response['body'],
      options: Response['options'],
    ) => void
  },
) => Promise<void>

export const StartServer = async (
  address: string,
  id: string,
  handler: HttpServerHandler,
  options: ServerOptions = {},
) => {
  const _options: Required<ServerOptions> = {
    Cert: '',
    Key: '',
    StaticPath: '', // Default: /static
    StaticRoute: '/static/',
    StaticHeaders: {},
    UploadPath: '', // Default: /upload
    UploadRoute: '/upload',
    UploadHeaders: {},
    MaxUploadSize: 50 * 1024 * 1024, // 50MB
    ...options,
  }
  const { flag, data } = await Bridge.StartServer(address, id, _options)
  if (!flag) {
    throw new Error(data)
  }

  EventsOn(id, (...args) => {
    void (async () => {
      const [requestId, method, url, headers, body] = args as [
        Request['id'],
        Request['method'],
        Request['url'],
        Recordable<string[]>,
        Request['body'],
      ]
      try {
        await handler(
          {
            id: requestId,
            method,
            url,
            headers: Object.fromEntries(Object.entries(headers).map(([k, v]) => [k, v[0] ?? ''])),
            body,
          },
          {
            end: (status, resHeaders, resBody, resOptions) => {
              EventsEmit(
                requestId,
                status,
                JSON.stringify(resHeaders),
                resBody,
                JSON.stringify(resOptions),
              )
            },
          },
        )
      } catch (error: any) {
        console.log('Server handler err:', error, requestId)
        EventsEmit(
          requestId,
          500,
          JSON.stringify({ 'Content-Type': 'text/plain; charset=utf-8' }),
          normalizeErrorMessage(error),
          JSON.stringify({ Mode: 'Text' }),
        )
      }
    })()
  })
  return { close: () => StopServer(id) }
}

export const StopServer = async (serverID: string) => {
  const { flag, data } = await Bridge.StopServer(serverID)
  if (!flag) {
    throw new Error(data)
  }
  EventsOff(serverID)
  return data
}

export const ListServer = async () => {
  const { flag, data } = await Bridge.ListServer()
  if (!flag) {
    throw new Error(data)
  }
  return data.split('|').filter((id) => id.length)
}
