import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encontrarMenus } from '@/test/helpers.ts';
import { mockApi, renderRoute } from '@/test/render.tsx';

describe('EscolhaPerfilPage', () => {
  beforeEach(() => mockApi({}));

  test('lista os 4 perfis', async () => {
    renderRoute('/');

    const perfis = await screen.findByRole('list', { name: 'Perfis' });
    expect(
      within(perfis)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/familia', '/aluno', '/professor', '/escola']);
  });

  test('escolher um perfil abre a casca dele', async () => {
    renderRoute('/');

    await userEvent.click(await screen.findByRole('link', { name: /Professor/ }));

    const { menuLateral } = await encontrarMenus();
    expect(within(menuLateral).getByRole('link', { name: 'Diário de classe' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument();
  });

  test('"Trocar perfil" no menu volta para a escolha', async () => {
    renderRoute('/aluno');

    const { menuLateral } = await encontrarMenus();
    await userEvent.click(within(menuLateral).getByRole('link', { name: 'Trocar perfil' }));

    expect(await screen.findByRole('heading', { name: 'Quem vai usar?' })).toBeInTheDocument();
  });
});
