import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';

const TOKENS = readFileSync(
  fileURLToPath(new URL('../../packages/design-system/src/tokens.css', import.meta.url)),
  'utf8',
);

/** Valor de um token do tema claro (o primeiro bloco de `tokens.css`). */
const lerToken = (nome: string) => {
  const valor = new RegExp(`--${nome}:\\s*([^;]+);`).exec(TOKENS)?.[1]?.trim();
  if (!valor) throw new Error(`Token --${nome} não encontrado em tokens.css.`);
  return valor;
};

const COR_DO_TEMA = lerToken('brand');
const COR_DE_FUNDO = lerToken('surface-0');

/** Cor da barra do navegador no celular, a mesma do manifesto. */
const corDoTemaNoHtml = (): Plugin => ({
  name: 'recreio:cor-do-tema',
  transformIndexHtml: () => [{ tag: 'meta', attrs: { name: 'theme-color', content: COR_DO_TEMA }, injectTo: 'head' }],
});

export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    corDoTemaNoHtml(),
    VitePWA({
      registerType: 'prompt',
      strategies: 'generateSW',
      includeAssets: ['favicon.png', 'icons/apple-touch-icon.png'],
      manifest: {
        name: 'Recreio',
        short_name: 'Recreio',
        description: 'Portal da escola: agenda, boletim, mensalidades e recados num só lugar.',
        lang: 'pt-BR',
        dir: 'ltr',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        theme_color: COR_DO_TEMA,
        background_color: COR_DE_FUNDO,
        categories: ['education'],
        icons: [
          { src: '/icons/icone-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icone-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          { src: '/icons/icone-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,woff2}'],
        // Toda rota do portal abre o index.html salvo; o React Router decide a tela, inclusive sem conexão.
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//],
        // Dado da API nunca vem do cache do service worker: sem conexão, a tela mostra o estado de erro.
        runtimeCaching: [
          {
            urlPattern: ({ url, sameOrigin }) => sameOrigin && url.pathname.startsWith('/api/'),
            handler: 'NetworkOnly',
          },
        ],
        cleanupOutdatedCaches: true,
      },
    }),
  ],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
});
