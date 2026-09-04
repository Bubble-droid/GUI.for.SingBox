import type { action, default_rule, logical_rule } from '@zhexin/typebox/route'

import type { Route } from './config'
import type { ItemOf, ByType, ByAction } from './utils'

// RuleSet
export type RuleSet = ItemOf<Route['rule_set']>
export type RuleSetOf<T extends RuleSet['type']> = ByType<RuleSet, T>

// Route Rule
export type RouteRule = ItemOf<Route['rules']>
export type RouteDefaultRule = default_rule<string, string, string>
export type RouteLogicalRule = logical_rule<string, string, string, string>
export type RouteAction = action<string, string>
export type RouteActionOf<A extends NonNullable<RouteAction['action']>> = ByAction<RouteAction, A>
