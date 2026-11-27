import babel from '@rolldown/plugin-babel';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';
import { defineConfig } from 'vitest/config';
import { apiFalsa } from './e2e/api-falsa.ts';

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

// `--mode api-falsa` (só no `vite preview` do e2e e do Lighthouse) troca a API por respostas fixas.
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] }),
    corDoTemaNoHtml(),
    mode === 'api-falsa' && apiFalsa(),
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
  build: {
    rolldownOptions: {
      output: {
        // Bibliotecas mudam menos que o portal: em arquivos próprios, ficam no cache do navegador entre deploys.
        codeSplitting: {
          groups: [
            { name: 'react', test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/, priority: 30 },
            { name: 'router', test: /[\\/]node_modules[\\/](react-router|@remix-run)[\\/]/, priority: 20 },
            { name: 'query', test: /[\\/]node_modules[\\/]@tanstack[\\/]/, priority: 20 },
            { name: 'zod', test: /[\\/]node_modules[\\/]zod[\\/]/, priority: 20 },
            // Só os arquivos do design system usados por 2 ou mais partes do portal.
            // Um arquivo usado por uma página só (como o `school.tsx` das preferências) fica no arquivo da página.
            { name: 'design-system', test: /[\\/]packages[\\/]design-system[\\/]/, priority: 10, minShareCount: 2 },
          ],
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:3333',
    },
  },
  test: {
    globals: true,
    // e2e/ é do Playwright, fora do Vitest.
    include: ['src/**/*.test.{ts,tsx}'],
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    css: false,
  },
}));
