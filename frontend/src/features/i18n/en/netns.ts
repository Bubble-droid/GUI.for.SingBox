export default {
  title: 'Network Namespaces',
  tag: 'Namespace Tag',
  type: {
    title: 'Namespace Type',
    default: 'Default (Attach to existing namespace)',
    unshare: 'Unshare (Create unprivileged namespace)',
  },
  default: {
    path: 'Namespace Name or Path',
  },
  unshare: {
    pid_file: 'PID File Path',
  },
}
