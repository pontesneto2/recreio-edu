import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encontrarMenus } from '@/test/helpers.ts';
import { TODOS_OS_PERFIS, comSessao, mockApi, renderRoute, naEscola } from '@/test/render.tsx';

describe('EscolhaPerfilPage', () => {
  test('com 2 vínculos, lista só os perfis liberados', async () => {
    mockApi(comSessao(['responsavel', 'professor']));
    renderRoute('/');

    const perfis = await screen.findByRole('list', { name: 'Perfis' });
    expect(
      within(perfis)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([naEscola('/familia'), naEscola('/professor')]);
    expect(screen.getByText('Fernanda Lima · Colégio Recreio · 2 perfis liberados')).toBeInTheDocument();
  });

  test('com 1 vínculo, abre direto a casca do perfil', async () => {
    mockApi(comSessao(['professor'], 'Ricardo Albuquerque'));
    const { router } = renderRoute('/');

    const { menuLateral } = await encontrarMenus();
    expect(within(menuLateral).getByRole('link', { name: 'Diário de classe' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(naEscola('/professor'));
    expect(screen.queryByRole('heading', { name: 'Quem vai usar?' })).not.toBeInTheDocument();
  });

  test('vínculos da equipe da escola contam como um perfil só', async () => {
    mockApi(comSessao(['secretaria', 'financeiro']));
    const { router } = renderRoute('/');

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/escola'));
  });

  test('escolher um perfil abre a casca dele', async () => {
    mockApi(comSessao(TODOS_OS_PERFIS));
    renderRoute('/');

    await userEvent.click(await screen.findByRole('link', { name: /Professor/ }));

    const { menuLateral } = await encontrarMenus();
    expect(within(menuLateral).getByRole('link', { name: 'Diário de classe' })).toBeInTheDocument();
    expect(await screen.findByRole('heading', { name: 'Início' })).toBeInTheDocument();
  });

  test('"Trocar perfil" no menu volta para a escolha', async () => {
    mockApi(comSessao(TODOS_OS_PERFIS));
    renderRoute(naEscola('/aluno'));

    const { menuLateral } = await encontrarMenus();
    await userEvent.click(within(menuLateral).getByRole('link', { name: 'Trocar perfil' }));

    expect(await screen.findByRole('heading', { name: 'Quem vai usar?' })).toBeInTheDocument();
  });
});
