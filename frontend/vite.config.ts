import vue from '@vitejs/plugin-vue'
import { defineConfig, loadEnv } from 'vite'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isDev = mode === 'development'

  const devFlag = isDev ? '-dev' : ''
  const appTitle = `${env.VITE_APP_TITLE}${devFlag}`
  const appID = `${env.VITE_APP_ID}${devFlag}`

  return {
    base: './',
    plugins: [vue()],
    define: {
      'import.meta.env.VITE_APP_TITLE': JSON.stringify(appTitle),
      'import.meta.env.VITE_APP_ID': JSON.stringify(appID),
    },
    server: {
      watch: {
        ignored: ['**/node_modules/**', '**/.git/**', '**/dist/**', '**/src/bridge/wailsjs/**'],
      },
    },
    resolve: {
      extensions: ['.ts', '.js'],
      tsconfigPaths: true,
      alias: {
        vue: 'vue/dist/vue.esm-bundler.js',
      },
    },
    build: {
      cssCodeSplit: false,
      chunkSizeWarningLimit: 4096, // 4MB
      rolldownOptions: {
        output: {
          strictExecutionOrder: true,
          codeSplitting: {
            groups: [
              { name: 'vue', test: /node_modules\/vue/ },
              { name: 'codemirror', test: /node_modules\/@codemirror/ },
              { name: 'prettier', test: /node_modules\/prettier/ },
              { name: 'vendor', test: /node_modules/ },
              { name: 'index' },
            ],
          },
        },
      },
    },
  }
})
