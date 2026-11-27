import { esperarSemViolacoesGraves } from './axe.ts';
import { EU, naEscola, SLUG } from './dados.ts';
import { expect, test } from './fixtures.ts';

const SENHA = 'senha-de-demonstracao';

// A vitrine da entrada troca de destaque a cada 6 s. Com movimento reduzido ela para, e o axe lê a página parada.
test.use({ contextOptions: { reducedMotion: 'reduce' } });

test('sem sessão, a casca leva a Entrar da escola e o login volta para ela', async ({ page }) => {
  let logado = false;
  await page.route('**/api/v1/eu', (rota) =>
    logado
      ? rota.fulfill({ json: EU })
      : rota.fulfill({
          status: 401,
          contentType: 'application/problem+json',
          json: {
            type: 'https://recreio.app/problemas/nao-autenticado',
            title: 'Sessão ausente ou expirada',
            status: 401,
            code: 'NAO_AUTENTICADO',
          },
        }),
  );
  await page.route('**/api/auth/sign-in/email', (rota) => {
    const { password } = rota.request().postDataJSON() as { password: string };
    if (password !== SENHA) {
      return rota.fulfill({ status: 401, json: { code: 'INVALID_EMAIL_OR_PASSWORD', message: 'Invalid' } });
    }
    logado = true;
    return rota.fulfill({ json: { redirect: false, token: 'x' } });
  });

  await page.goto(naEscola('/escola/alunos'));
  await expect(page).toHaveURL(`${naEscola('/entrar')}?voltar=%2F${SLUG}%2Fescola%2Falunos`);
  await expect(page.getByRole('heading', { name: 'Entrar' })).toBeVisible();
  await expect(page.getByText('Colégio Recreio').first()).toBeVisible();
  await esperarSemViolacoesGraves(page);

  const form = page.getByRole('form', { name: 'Entrar' });
  await form.getByLabel(/E-mail/).fill(EU.usuario.email);
  await form.getByLabel(/^Senha/).fill('senha-errada-00');
  await form.getByRole('button', { name: 'Entrar' }).click();
  await expect(page.getByText('E-mail ou senha não conferem. Confira os dois e tente de novo.')).toBeVisible();

  await form.getByLabel(/^Senha/).fill(SENHA);
  await form.getByRole('button', { name: 'Entrar' }).click();
  await expect(page).toHaveURL(naEscola('/escola/alunos'));
  await expect(page.getByRole('heading', { name: 'Alunos' })).toBeVisible();
});
