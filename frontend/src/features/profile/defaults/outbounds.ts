import { OutboundType } from '@profile/constant/kernel'
import type { OutboundItem } from '@profile/types/profiles/outbounds'

import { DefaultTestURL } from '@/constant/app'
import i18n from '@/lang'
import { sampleID } from '@/utils/others'

import { DefaultOutboundIds } from './shared'

const { t } = i18n.global

export const createOutbound = (): OutboundItem => ({
  id: sampleID(),
  tag: '',
  type: OutboundType.Selector,
  outbounds: [],
  interrupt_exist_connections: true,
  url: DefaultTestURL,
  interval: '3m',
  tolerance: 150,
  include: '',
  exclude: '',
  icon: '',
  hidden: false,
})

export const createOutbounds = (): OutboundItem[] => [
  {
    id: DefaultOutboundIds.Select,
    tag: t('outbound.select'),
    type: OutboundType.Selector,
    outbounds: [{ id: DefaultOutboundIds.Urltest, type: 'Built-in', tag: t('outbound.urltest') }],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
  {
    id: DefaultOutboundIds.Urltest,
    tag: t('outbound.urltest'),
    type: OutboundType.UrlTest,
    outbounds: [],
    interrupt_exist_connections: true,
    url: DefaultTestURL,
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
  {
    id: DefaultOutboundIds.Direct,
    tag: t('outbound.direct'),
    type: OutboundType.Selector,
    outbounds: [
      { id: 'direct', type: 'Built-in', tag: 'direct' },
      { id: 'block', type: 'Built-in', tag: 'block' },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
  {
    id: DefaultOutboundIds.Block,
    tag: t('outbound.block'),
    type: OutboundType.Selector,
    outbounds: [
      { id: 'block', type: 'Built-in', tag: 'block' },
      { id: 'direct', type: 'Built-in', tag: 'direct' },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
  {
    id: DefaultOutboundIds.Fallback,
    tag: t('outbound.fallback'),
    type: OutboundType.Selector,
    outbounds: [
      { id: DefaultOutboundIds.Select, type: 'Built-in', tag: t('outbound.select') },
      { id: DefaultOutboundIds.Direct, type: 'Built-in', tag: t('outbound.direct') },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
  {
    id: DefaultOutboundIds.Global,
    tag: 'GLOBAL',
    type: OutboundType.Selector,
    outbounds: [
      { id: DefaultOutboundIds.Select, type: 'Built-in', tag: t('outbound.select') },
      { id: DefaultOutboundIds.Urltest, type: 'Built-in', tag: t('outbound.urltest') },
      { id: DefaultOutboundIds.Direct, type: 'Built-in', tag: t('outbound.direct') },
      { id: DefaultOutboundIds.Block, type: 'Built-in', tag: t('outbound.block') },
      { id: DefaultOutboundIds.Fallback, type: 'Built-in', tag: t('outbound.fallback') },
    ],
    interrupt_exist_connections: true,
    url: '',
    interval: '3m',
    tolerance: 150,
    include: '',
    exclude: '',
    icon: '',
    hidden: false,
  },
]
