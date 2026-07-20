import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  // Local API by default. Override with VITE_PROXY_TARGET if you need production.
  // Example production proxy: VITE_PROXY_TARGET=https://api.onchainforexai.com
  const proxyTarget =
    env.VITE_PROXY_TARGET ||
    env.VITE_API_URL ||
    'http://localhost:5000'

  const isLocalTarget =
    proxyTarget.includes('localhost') ||
    proxyTarget.includes('127.0.0.1')

  console.log(`[vite] /api proxy → ${proxyTarget}`)

  // Google Identity Services needs popups / postMessage; strict COOP breaks GIS.
  const coopHeaders = {
    'Cross-Origin-Opener-Policy': 'same-origin-allow-popups'
  }

  return {
    plugins: [react()],
    server: {
      port: 3000,
      headers: coopHeaders,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
          secure: !isLocalTarget,
          rewrite: (path) => path,
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('Proxy error:', err.message)
              console.log(`Is the API running at ${proxyTarget}?`)
            })
            proxy.on('proxyReq', (proxyReq, req) => {
              console.log(`🔄 Proxying ${req.method} ${req.url} → ${proxyTarget}`)
            })
          }
        },
        '/uploads': {
          target: proxyTarget,
          changeOrigin: true,
          secure: !isLocalTarget
        },
        '/socket.io': {
          target: proxyTarget,
          changeOrigin: true,
          secure: !isLocalTarget,
          ws: true,
          // Helpful when clients still hit the Vite host for sockets
          configure: (proxy) => {
            proxy.on('error', (err) => {
              console.log('[vite] socket.io proxy error:', err.message)
            })
          }
        }
      }
    },
    preview: {
      headers: coopHeaders
    }
  }
})






