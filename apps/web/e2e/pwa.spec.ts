import { expect, test } from '@playwright/test';

// O Lighthouse 12 tirou a categoria PWA. Este arquivo confere o que ela conferia: manifesto, service worker e abrir sem conexão.
// O service worker fica ligado aqui. A API vem do `--mode api-falsa` do `vite preview`, porque o `page.route` não vê o service worker.
test.use({ serviceWorkers: 'allow' });

type Manifesto = {
  name: string;
  lang: string;
  start_url: string;
  display: string;
  icons: Array<{ sizes: string; purpose?: string }>;
};

test('o manifesto tem o que a instalação pede', async ({ page, request }) => {
  await page.goto('/');
  const href = await page.locator('link[rel="manifest"]').getAttribute('href');
  expect(href).toBeTruthy();

  const manifesto = (await (await request.get(href ?? '')).json()) as Manifesto;
  expect(manifesto).toMatchObject({ name: 'Recreio', lang: 'pt-BR', start_url: '/', display: 'standalone' });
  expect(manifesto.icons.map((icone) => icone.sizes)).toEqual(expect.arrayContaining(['192x192', '512x512']));
  expect(manifesto.icons.some((icone) => icone.purpose === 'maskable')).toBe(true);
  await expect(page.locator('meta[name="theme-color"]')).toHaveAttribute('content', /^#/);
});

test('o service worker assume a página e o portal abre sem conexão', async ({ page, context }) => {
  await page.goto('/escola');
  // O primeiro service worker ativa sozinho e passa a controlar a página depois de recarregar.
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => undefined));
  await page.reload();
  await expect.poll(() => page.evaluate(() => navigator.serviceWorker.controller !== null)).toBe(true);

  await context.setOffline(true);
  await page.goto('/familia');

  // A casca e a página sob demanda saem do precache do Workbox.
  const menu = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
  await expect(menu.getByRole('link', { name: 'Hoje', exact: true })).toHaveAttribute('aria-current', 'page');
  await expect(page.getByRole('heading', { name: 'Hoje' })).toBeVisible();
  await expect(page.getByText('Sem internet', { exact: true })).toBeVisible();
});
