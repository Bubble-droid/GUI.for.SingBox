import type { action, default_rule, logical_rule } from '@zhexin/typebox/dns'

import type { Dns } from './config'
import type { Discriminated, ItemOf, ByType, ByAction } from './utils'

// DNS Server
export type DnsServer = Discriminated<ItemOf<Dns['servers']>>
export type DnsServerOf<T extends DnsServer['type']> = ByType<DnsServer, T>

// DNS Rule
export type DnsRule = ItemOf<Dns['rules']>
export type DnsDefaultRule = default_rule<string, string, string, string, string>
export type DnsLogicalRule = logical_rule<string, string, string, string, string>
export type DnsAction = action<string, string>
export type DnsActionOf<A extends NonNullable<DnsAction['action']>> = ByAction<DnsAction, A>
