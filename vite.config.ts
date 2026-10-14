import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
      proxy: (() => {
        const backendTarget = process.env.BACKEND_URL || 'https://attritioniq-production.up.railway.app';
        return {
          '/api': {
            target: backendTarget,
            changeOrigin: true,
            secure: false,
            rewrite: (path: string) => path.replace(/^\/api/, ''),
            configure: (proxy: any) => {
              proxy.on('error', (_err: any, _req: any, res: any) => {
                if (res && 'writeHead' in res && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'offline', message: 'Backend unavailable' }));
                }
              });
            },
          },
          '^/(health|sample-data|upload|dataset|eda|train|feature-importance|predict|predict-batch|dashboard|advisor)': {
            target: backendTarget,
            changeOrigin: true,
            secure: false,
            configure: (proxy: any) => {
              proxy.on('error', (_err: any, _req: any, res: any) => {
                if (res && 'writeHead' in res && !res.headersSent) {
                  res.writeHead(503, { 'Content-Type': 'application/json' });
                  res.end(JSON.stringify({ status: 'offline', message: 'Backend unavailable' }));
                }
              });
            },
          },
        };
      })(),
    },
  };
});
