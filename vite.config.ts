import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'
import { ViteImageOptimizer } from 'vite-plugin-image-optimizer'
import { compression } from 'vite-plugin-compression2'
import { visualizer } from 'rollup-plugin-visualizer'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendTarget = env.API_PROXY_TARGET || 'http://localhost:8000'
  const proxy = {
    '/api/v1': { target: backendTarget, changeOrigin: true },
    '/ws': { target: backendTarget, changeOrigin: true, ws: true },
  }

  return {
  envPrefix: ['VITE_', 'SUPABASE_', 'AUTH_'],
  server: {
    proxy,
    allowedHosts: ['.trycloudflare.com'],
    watch: { ignored: ['**/*.local/**'] },
  },
  preview: { proxy },
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    tailwindcss(),
    ViteImageOptimizer({
      png: { quality: 85 },
      jpeg: { quality: 80 },
      webp: { quality: 80, lossless: false },
      avif: { quality: 75, lossless: false },
    }),
    compression({
      algorithms: ['brotliCompress', 'gzip'],
      exclude: [/\.(br)$/, /\.(gz)$/],
      threshold: 1024,
    }),
    visualizer({
      filename: 'dist/stats.html',
      gzipSize: true,
      brotliSize: true,
      open: false,
    }),
  ],

  build: {
    sourcemap: false,
    target: 'es2022',
    cssMinify: true,
    rollupOptions: {
      output: {
        manualChunks(id: string) {
          if (id.includes('@tanstack/react-router') || id.includes('@tanstack/react-form')) {
            return 'tanstack-vendor'
          }
          if (id.includes('lucide-react')) {
            return 'lucide-icons'
          }
        },
      },
    },
  },
  }
})
