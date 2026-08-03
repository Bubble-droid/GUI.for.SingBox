export const experimental = {
  clash_api: {
    title: 'Clash API 配置',
    external_controller: 'Clash API 监听地址',
    external_ui: 'Web UI 资源路径',
    external_ui_download_url: 'Web UI 资源下载地址',
    external_ui_download_detour: '下载 Web UI 资源的出站',
    secret: 'Clash API 密钥',
    default_mode: '默认工作模式',
    access_control_allow_origin: '允许的跨域来源',
    access_control_allow_private_network: '允许从私有网络访问',
  },
  cache_file: {
    title: '缓存文件配置',
    enabled: '启用缓存',
    path: '缓存文件路径',
    cache_id: '缓存标识符',
    store_fakeip: '存储 FakeIP',
    store_dns: '存储 DNS',
  },
}
