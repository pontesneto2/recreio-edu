import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encontrarMenus } from '@/test/helpers.ts';
import { euCom, mockApi, renderRoute, semSessao, naEscola } from '@/test/render.tsx';

/** API em que a sessão termina no `POST /api/auth/sign-out`. */
const apiComSaida = () => {
  let logado = true;
  const anonimo = semSessao();
  return mockApi({
    ...anonimo,
    '/api/v1/eu': () => (logado ? Response.json(euCom(['responsavel', 'professor'])) : anonimo['/api/v1/eu']()),
    'POST /api/auth/sign-out': () => {
      logado = false;
      return Response.json({ success: true });
    },
  });
};

describe('sair', () => {
  test('"Sair" no seletor de perfil encerra a sessão e volta para Entrar', async () => {
    const fetchSimulado = apiComSaida();
    const { router } = renderRoute(naEscola('/familia'));
    const { menuLateral } = await encontrarMenus();

    await userEvent.click(within(menuLateral).getByRole('button', { name: /Fernanda/ }));
    await userEvent.click(within(menuLateral).getByRole('button', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(naEscola('/entrar'));
    expect(fetchSimulado).toHaveBeenCalledWith('/api/auth/sign-out', expect.objectContaining({ method: 'POST' }));
  });

  test('"Sair" no menu lateral faz o mesmo', async () => {
    apiComSaida();
    const { router } = renderRoute(naEscola('/professor'));
    const { menuLateral } = await encontrarMenus();

    await userEvent.click(within(menuLateral).getByRole('link', { name: 'Sair' }));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(naEscola('/entrar'));
  });

  test('depois de sair, a casca do perfil pede login de novo', async () => {
    apiComSaida();
    const { router } = renderRoute('/sair');

    await screen.findByRole('heading', { name: 'Entrar' });
    await router.navigate(naEscola('/familia'));

    await vi.waitFor(() => expect(router.state.location.pathname).toBe(naEscola('/entrar')));
    expect(new URLSearchParams(router.state.location.search).get('voltar')).toBe(naEscola('/familia'));
    expect(screen.getByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
  });
});
