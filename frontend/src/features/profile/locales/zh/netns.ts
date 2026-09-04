export default {
  title: '网络命名空间',
  tag: '命名空间标签',
  type: {
    title: '命名空间类型',
    default: 'Default (附加到已有命名空间)',
    unshare: 'Unshare (新建非特权命名空间)',
  },
  default: {
    path: '命名空间名称或路径',
  },
  unshare: {
    pid_file: 'PID 文件路径',
  },
}
