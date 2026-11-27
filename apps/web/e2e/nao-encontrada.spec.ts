import { esperarSemViolacoesGraves } from './axe.ts';
import { naEscola } from './dados.ts';
import { expect, test } from './fixtures.ts';

test('slug que não é de escola nenhuma mostra a página não encontrada', async ({ page }) => {
  await page.goto('/endereco-que-nao-existe');

  await expect(page.getByText('Página não encontrada')).toBeVisible();
  await esperarSemViolacoesGraves(page);
});

test('endereço desconhecido dentro de um perfil mantém o menu do perfil', async ({ page }) => {
  await page.goto(naEscola('/familia/nao-existe'));

  await expect(page.getByText('Página não encontrada')).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true })).toHaveCount(1);
  await esperarSemViolacoesGraves(page);
});
