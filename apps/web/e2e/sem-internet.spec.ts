import { esperarSemViolacoesGraves } from './axe.ts';
import { expect, test } from './fixtures.ts';

test('sem conexão, a faixa do topo leva à tela do modo sem internet', async ({ page, context }) => {
  await page.goto('/escola');
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).first()).toBeVisible();

  await context.setOffline(true);
  await expect(page.getByText('Sem internet', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Ver o que funciona sem internet' }).click();

  await expect(page).toHaveURL('/sem-internet');
  await expect(page.getByRole('heading', { name: 'Modo sem internet' })).toBeVisible();
  await expect(page.getByText('O essencial continua aqui')).toBeVisible();
  await expect(page.getByRole('list', { name: 'Precisa de internet' }).getByText('Indisponível')).toHaveCount(3);
  await esperarSemViolacoesGraves(page);
});

test('com a conexão de volta, oferece voltar ao início', async ({ page }) => {
  await page.goto('/sem-internet');

  await expect(page.getByText('A conexão voltou. As telas já carregam dados novos.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Voltar ao início' })).toBeVisible();
  await esperarSemViolacoesGraves(page);
});
