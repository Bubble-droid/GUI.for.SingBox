import certificate from './certificate'
import dns from './dns'
import endpoints from './endpoints'
import experimental from './experimental'
import http_clients from './http_clients'
import inbounds from './inbounds'
import log from './log'
import netns from './netns'
import ntp from './ntp'
import outbounds from './outbounds'
import route from './route'
import rules from './rules'
import shared from './shared'

export default {
  rule: '规则',
  global: '全局',
  direct: '直连',
  ruleDesc: '按照规则文件分流',
  globalDesc: '仅走Global策略组',
  directDesc: '直接连接所有流量',
  shared,
  log,
  ntp,
  certificate,
  experimental,
  http_clients,
  netns,
  endpoints,
  inbounds,
  outbounds,
  rules,
  route,
  strategy: {
    name: '策略',
    default: '默认',
    byDnsRules: '由DNS路由规则决定',
    prefer_ipv4: 'IPV4优先',
    prefer_ipv6: 'IPV6优先',
    ipv4_only: '只使用IPV4',
    ipv6_only: '只使用IPV6',
  },
  dns,
  mode: '工作模式',
  'allow-lan': '允许局域网访问',
  'disallow-lan': '禁止局域网访问',
  notFound: '无核心',
  insertionPoint: '新规则将插入到这里',
  addInsertionPoint: '添加插入点',
  missingInsertionPoint: '请先添加插入点',
  startupFailed: '启动失败，请查看日志详情',
}
