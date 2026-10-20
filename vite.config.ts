import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const configEnv = loadEnv(mode, process.cwd(), 'VITE_');
  const apiBaseUrl = (process.env.VITE_API_BASE_URL ?? configEnv.VITE_API_BASE_URL ?? '').trim();
  if ((process.env.CF_PAGES === '1' || process.env.WORKERS_CI === '1') && !apiBaseUrl) {
    throw new Error('Set VITE_API_BASE_URL to the public HTTPS backend origin before building on Cloudflare. The Vite development proxy is not included in dist/.');
  }
  if (apiBaseUrl) {
    const apiUrl = new URL(apiBaseUrl);
    if (!['http:', 'https:'].includes(apiUrl.protocol) || apiUrl.pathname !== '/' || apiUrl.search || apiUrl.hash || apiUrl.username || apiUrl.password) {
      throw new Error('VITE_API_BASE_URL must be an HTTP(S) origin without /api, credentials, query, or fragment.');
    }
    if (mode === 'production' && apiUrl.protocol !== 'https:' && !['localhost', '127.0.0.1', '[::1]'].includes(apiUrl.hostname)) {
      throw new Error('Production VITE_API_BASE_URL must use HTTPS to avoid browser mixed-content blocking.');
    }
  }
  return {
  plugins: [react()],
  server: {
    port: 5173,
    host: true,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
  },
  };
});
