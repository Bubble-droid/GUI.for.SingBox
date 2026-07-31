export * from './log'
export * from './experimental'
export * from './inbounds'
export * from './outbounds'
export * from './route'
export * from './dns'

export const DefaultMixin = (): App.Profile['mixin'] => {
  return { priority: 'mixin', format: 'json', config: '' }
}

export const DefaultScript = (): App.Profile['script'] => {
  return { code: `const onGenerate = async (config) => {\n  return config\n}` }
}
