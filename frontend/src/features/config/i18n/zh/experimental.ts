export const experimental = {
  clash_api: {
    external_controller: 'RESTful Web API监听地址',
    external_ui: 'Web UI路径',
    external_ui_download_url: 'Web UI下载地址',
    external_ui_download_detour: 'Web UI下载地址的出站标签',
    secret: 'RESTful API密钥',
    default_mode: '工作模式',
    access_control_allow_origin: '允许的CORS来源',
    access_control_allow_private_network: '允许从私有网络访问',
  },
  cache_file: {
    enabled: '启用缓存',
    path: '缓存文件路径',
    cache_id: '缓存文件中的标识符',
    store_fakeip: '持久化FakeIP',
    store_rdrc: '持久化已拒绝的DNS响应',
    rdrc_timeout: '拒绝的DNS响应缓存超时',
  },
}
