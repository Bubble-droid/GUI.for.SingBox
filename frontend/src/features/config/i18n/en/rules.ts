import type { MessageSchema } from '../types'

export const rules = {
  type: {
    name: 'Type',
    inbound: 'inbound',
    network: 'network',
    protocol: 'protocol',
    domain: 'domain',
    domain_suffix: 'domain_suffix',
    domain_keyword: 'domain_keyword',
    domain_regex: 'domain_regex',
    source_ip_cidr: 'source_ip_cidr',
    ip_cidr: 'ip_cidr',
    ip_is_private: 'ip_is_private',
    source_port: 'source_port',
    source_port_range: 'source_port_range',
    port: 'port',
    port_range: 'port_range',
    process_name: 'process_name',
    process_path: 'process_path',
    process_path_regex: 'process_path_regex',
    clash_mode: 'clash_mode',
    rule_set: 'rule_set',
    ip_accept_any: 'ip_accept_any',
    inline: 'Inline',
  },
} satisfies MessageSchema['rules']
