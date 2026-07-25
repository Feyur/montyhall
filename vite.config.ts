import path from 'path';
import { defineConfig, Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

/**
 * В офлайн-сборке страница лежит на диске: ссылки на иконки, манифест и
 * шрифты с сети только дали бы ошибки в консоли, поэтому вырезаем их.
 * Шрифт подменяется системным — он указан в фолбэке Tailwind.
 */
const stripExternalRefs = (): Plugin => ({
  name: 'strip-external-refs',
  transformIndexHtml: (html) =>
    html
      .replace(/\s*<link rel="(icon|apple-touch-icon|manifest)"[^>]*>/g, '')
      .replace(/\s*<link rel="preconnect"[^>]*>/g, '')
      .replace(/\s*<link\s+rel="stylesheet"\s+href="https:\/\/fonts\.googleapis\.com[^>]*>/g, ''),
});

export default defineConfig(({ mode }) => {
  const isOffline = mode === 'offline';

  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [react(), ...(isOffline ? [viteSingleFile(), stripExternalRefs()] : [])],
    build: {
      outDir: isOffline ? 'dist-offline' : 'dist',
      // Офлайн-сборка: картинки и звуки уезжают в data-URI внутрь html
      assetsInlineLimit: isOffline ? Number.MAX_SAFE_INTEGER : 4096,
      rollupOptions: isOffline
        ? {}
        : {
            output: {
              // recharts тянет за собой d3 — выносим графики отдельным чанком,
              // чтобы код приложения кэшировался независимо от библиотеки
              manualChunks: { charts: ['recharts'] },
            },
          },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  };
});
