import type { PerfilDeVinculo } from '@recreio/contracts';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { encontrarMenus } from '@/test/helpers.ts';
import {
  ESCOLA_PUBLICA,
  authErrorResponse,
  comSessao,
  euCom,
  mockApi,
  renderRoute,
  semSessao,
  naEscola,
  apiDaEscola,
} from '@/test/render.tsx';

const SENHA_CERTA = 'senha-certa-2026';

/** API em que `/api/v1/eu` passa a responder a sessão depois de um login com a senha certa. */
const apiDeLogin = (perfis: PerfilDeVinculo[]) => {
  let logado = false;
  const anonimo = semSessao();
  return mockApi({
    ...anonimo,
    '/api/v1/eu': () => (logado ? Response.json(euCom(perfis)) : anonimo['/api/v1/eu']()),
    [apiDaEscola('/alunos')]: [],
    [apiDaEscola()]: { ...ESCOLA_PUBLICA, cnpj: '07.412.386/0001-52', hoje: '2026-11-25', unidades: [] },
    'POST /api/auth/sign-in/email': (init?: RequestInit) => {
      const { password } = JSON.parse(String(init?.body)) as { password: string };
      if (password !== SENHA_CERTA) return authErrorResponse(401, 'INVALID_EMAIL_OR_PASSWORD');
      logado = true;
      return Response.json({ redirect: false, token: 'x' });
    },
  });
};

const preencher = async (email: string, senha: string) => {
  const form = await screen.findByRole('form', { name: 'Entrar' });
  await userEvent.type(within(form).getByLabelText(/E-mail/), email);
  await userEvent.type(within(form).getByLabelText(/^Senha/), senha);
  await userEvent.click(within(form).getByRole('button', { name: 'Entrar' }));
};

describe('EntrarPage', () => {
  test('mostra o nome da escola lido sem login', async () => {
    mockApi(semSessao());
    renderRoute(naEscola('/entrar'));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(await screen.findByText('Colégio Recreio')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Esqueci a senha' })).toHaveAttribute('href', '/esqueci-senha');
  });

  test('login certo envia e-mail e senha e abre o perfil da pessoa', async () => {
    const fetchSimulado = apiDeLogin(['professor']);
    const { router } = renderRoute(naEscola('/entrar'));

    await preencher('ricardo.albuquerque@colegiorecreio.test', SENHA_CERTA);

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/professor'));
    const login = fetchSimulado.mock.calls.find(([url]) => url === '/api/auth/sign-in/email');
    expect(login?.[1]).toMatchObject({ method: 'POST', credentials: 'include' });
    expect(JSON.parse(String(login?.[1]?.body))).toEqual({
      email: 'ricardo.albuquerque@colegiorecreio.test',
      password: SENHA_CERTA,
    });
  });

  test('login certo volta para o caminho guardado', async () => {
    apiDeLogin(['direcao']);
    const { router } = renderRoute(naEscola('/entrar?voltar=%2Fcolegio-recreio%2Fescola%2Falunos'));

    await preencher('lucia.menezes@colegiorecreio.test', SENHA_CERTA);

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/escola/alunos'));
  });

  test('caminho de volta para outro site é ignorado', async () => {
    apiDeLogin(['direcao']);
    const { router } = renderRoute(naEscola('/entrar?voltar=%2F%2Fgolpe.example'));

    await preencher('lucia.menezes@colegiorecreio.test', SENHA_CERTA);

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/escola'));
  });

  test('senha errada mostra o aviso e continua na tela', async () => {
    apiDeLogin(['direcao']);
    const { router } = renderRoute(naEscola('/entrar'));

    await preencher('lucia.menezes@colegiorecreio.test', 'senha-errada-0');

    expect(
      await screen.findByText('E-mail ou senha não conferem. Confira os dois e tente de novo.'),
    ).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(naEscola('/entrar'));
  });

  test('e-mail sem confirmação pede para confirmar', async () => {
    mockApi({ ...semSessao(), 'POST /api/auth/sign-in/email': () => authErrorResponse(403, 'EMAIL_NOT_VERIFIED') });
    renderRoute(naEscola('/entrar'));

    await preencher('nova@colegiorecreio.test', 'qualquer-senha-1');

    expect(await screen.findByText(/Confirme seu e-mail antes de entrar/)).toBeInTheDocument();
  });

  test('quem já tem sessão sai de Entrar para o portal', async () => {
    mockApi(comSessao(['aluno']));
    const { router } = renderRoute(naEscola('/entrar'));

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/aluno'));
  });
});
