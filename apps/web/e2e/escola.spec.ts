import { esperarSemViolacoesGraves } from './axe.ts';
import { ALUNOS, ESCOLA } from './dados.ts';
import { expect, test } from './fixtures.ts';

test('o painel da escola mostra as unidades e os alunos da API', async ({ page }) => {
  await page.goto('/escola');

  const unidades = page.getByRole('region', { name: 'Unidades' });
  for (const unidade of ESCOLA.unidades) {
    await expect(unidades.getByText(unidade.nome, { exact: false }).first()).toBeVisible();
  }
  for (const aluno of ALUNOS) {
    await expect(page.getByRole('cell', { name: aluno.nome })).toBeVisible();
  }
  await esperarSemViolacoesGraves(page);
});

test('com a API fora do ar, o painel mostra o erro e o "Tentar de novo"', async ({ page }) => {
  await page.route('**/api/v1/**', (rota) => rota.fulfill({ status: 503, body: 'Serviço indisponível' }));
  await page.goto('/escola');

  await expect(page.getByText('Não conseguimos carregar as unidades')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Tentar de novo' }).first()).toBeVisible();
  await esperarSemViolacoesGraves(page);
});
