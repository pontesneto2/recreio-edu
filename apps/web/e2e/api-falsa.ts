import type { Plugin } from 'vite';
import { naoEncontrado, RESPOSTAS } from './dados.ts';

/**
 * API falsa no `vite preview --mode api-falsa`: responde `/api/*` com `dados.ts`, sem backend.
 * Serve ao Lighthouse e ao teste do service worker, que o `page.route` do Playwright não intercepta.
 */
export const apiFalsa = (): Plugin => ({
  name: 'recreio:api-falsa',
  configurePreviewServer(server) {
    server.middlewares.use('/api', (req, res) => {
      const caminho = `/api${new URL(req.url ?? '/', 'http://localhost').pathname}`;
      const corpo = RESPOSTAS[caminho];
      res.statusCode = corpo === undefined ? 404 : 200;
      res.setHeader('Content-Type', corpo === undefined ? 'application/problem+json' : 'application/json');
      res.end(JSON.stringify(corpo ?? naoEncontrado(caminho)));
    });
  },
});
