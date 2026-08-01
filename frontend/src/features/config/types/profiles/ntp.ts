import type { Dialer } from './shared'

export interface NtpConfig {
  enabled: boolean
  server: string
  server_port: number
  interval: string
  dialer: Dialer
}
