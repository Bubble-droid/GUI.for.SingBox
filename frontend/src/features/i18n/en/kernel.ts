import type { MessageSchema } from '../types'
import dns from './dns'
import endpoints from './endpoints'
import experimental from './experimental'
import inbounds from './inbounds'
import log from './log'
import ntp from './ntp'
import outbounds from './outbounds'
import route from './route'
import rules from './rules'
import shared from './shared'

export default {
  rule: 'Rule',
  global: 'Global',
  direct: 'Direct',
  ruleDesc: 'Route traffic based on rules',
  globalDesc: 'Only follow the Global group',
  directDesc: 'Directly connect all traffic',
  shared,
  log,
  ntp,
  experimental,
  endpoints,
  inbounds,
  outbounds,
  rules,
  route,
  strategy: {
    name: 'Strategy',
    default: 'Default',
    byDnsRules: 'Determined by DNS rules',
    prefer_ipv4: 'Prefer IPV4',
    prefer_ipv6: 'Prefer IPV6',
    ipv4_only: 'IPV4 Only',
    ipv6_only: 'IPV6 Only',
  },
  dns,
  mode: 'Mode',
  'allow-lan': 'Allow LAN',
  'disallow-lan': 'Disallow LAN',
  notFound: 'Core Not Found',
  insertionPoint: 'The new rule will be inserted here',
  addInsertionPoint: 'Add insertion point',
  missingInsertionPoint: 'Please add an insertion point first',
  startupFailed: 'Startup failed, please Check logs for details',
} satisfies MessageSchema
