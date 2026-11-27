import { esperarSemViolacoesGraves } from './axe.ts';
import { expect, test } from './fixtures.ts';

const PERFIS = [
  { base: '/familia', entrada: 'Hoje' },
  { base: '/aluno', entrada: 'Hoje' },
  { base: '/professor', entrada: 'Início' },
  { base: '/escola', entrada: 'Painel' },
] as const;

test('a escolha de perfil lista os 4 perfis', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'Quem vai usar?' })).toBeVisible();
  const links = page.getByRole('list', { name: 'Perfis' }).getByRole('link');
  await expect(links).toHaveCount(4);
  await expect(links.nth(3)).toHaveAttribute('href', '/escola');
  await esperarSemViolacoesGraves(page);
});

for (const { base, entrada } of PERFIS) {
  test(`${base} abre a casca com o menu lateral do perfil`, async ({ page }) => {
    await page.goto(base);

    const menu = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
    await expect(menu).toHaveCount(1);
    await expect(menu.getByRole('link', { name: entrada, exact: true })).toHaveAttribute('aria-current', 'page');
    await expect(menu.getByRole('link', { name: 'Trocar perfil' })).toBeVisible();
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await esperarSemViolacoesGraves(page);
  });
}

test.describe('no celular', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('a barra inferior troca o menu lateral e o "Mais" abre o menu inteiro', async ({ page }) => {
    await page.goto('/familia');

    const barra = page.getByRole('navigation', { name: 'Navegação principal' }).filter({ visible: true });
    await expect(barra.getByRole('link')).toHaveCount(5);
    await barra.getByRole('link', { name: 'Mais' }).click();

    await expect(page).toHaveURL('/familia/mais');
    await expect(page.getByRole('heading', { name: 'Mais' })).toBeVisible();
    await esperarSemViolacoesGraves(page);
  });
});
