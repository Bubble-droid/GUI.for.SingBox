import type { MessageSchema } from '../types'

export default {
  title: 'HTTP Clients',
  tag: 'Client Tag',
  engine: {
    title: 'HTTP Engine',
    go: 'Go Standard Library',
    apple: 'Apple NSURLSession',
  },
  version: {
    title: 'HTTP Version',
  },
  disable_version_fallback: 'Disable Version Fallback',
  headers: 'Custom Headers',
} satisfies MessageSchema['http_clients']
