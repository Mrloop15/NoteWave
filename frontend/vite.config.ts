import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const target = env.API_PROXY_TARGET || 'http://127.0.0.1:8000'
  const backendPaths = [
    '/api',
    '/health',
    '/sanctum',
    '/login',
    '/logout',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/email',
    '/user',
  ]

  return {
    plugins: [vue()],
    server: {
      port: 5173,
      strictPort: true,
      proxy: Object.fromEntries(
        backendPaths.map((path) => [path, { target, changeOrigin: false }]),
      ),
    },
  }
})
