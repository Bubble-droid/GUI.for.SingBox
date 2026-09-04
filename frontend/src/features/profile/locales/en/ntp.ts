import type { MessageSchema } from '../types'

export default {
  enabled: 'Enable NTP Server',
  server: {
    title: 'NTP Server Address',
    aliyun: 'Alibaba Cloud NTP Server',
    tencent: 'Tencent Cloud NTP Server',
    tsinghua: 'Tsinghua University TUNA Mirror',
    ntsc: 'National Time Service Center (NTSC)',
    google: 'Google NTP Server',
    cloudflare: 'Cloudflare NTP Server',
    apple: 'Apple NTP Server',
    microsoft: 'Microsoft Windows Time Server',
    custom: 'Custom Server',
  },
  server_port: 'NTP Server Port',
  interval: 'Sync Interval',
} satisfies MessageSchema['ntp']
