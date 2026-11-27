import { test as base } from '@playwright/test';
import { naoEncontrado, RESPOSTAS } from './dados.ts';

/**
 * `test` do portal: toda chamada a `/api/` recebe a resposta de `dados.ts` pelo `page.route`, sem backend.
 * Caminho fora da lista recebe 404 no formato da API. Um `page.route` no próprio teste tem prioridade.
 */
export const test = base.extend<{ apiSimulada: void }>({
  apiSimulada: [
    async ({ page }, seguir) => {
      await page.route('**/api/**', (rota) => {
        const caminho = new URL(rota.request().url()).pathname;
        const corpo = RESPOSTAS[caminho];
        return corpo === undefined
          ? rota.fulfill({ status: 404, contentType: 'application/problem+json', json: naoEncontrado(caminho) })
          : rota.fulfill({ json: corpo });
      });
      await seguir();
    },
    { auto: true },
  ],
});

export { expect } from '@playwright/test';
