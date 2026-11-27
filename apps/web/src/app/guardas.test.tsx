import { screen, within } from '@testing-library/react';
import { encontrarMenus } from '@/test/helpers.ts';
import {
  ESCOLA_PUBLICA,
  SLUG,
  apiDaEscola,
  comSessao,
  euCom,
  mockApi,
  naEscola,
  problemResponse,
  renderRoute,
  semSessao,
} from '@/test/render.tsx';

const naoAutenticado = (instance: string) =>
  problemResponse(401, {
    type: 'https://recreio.app/problemas/nao-autenticado',
    title: 'Sessão ausente ou expirada',
    instance,
    code: 'NAO_AUTENTICADO',
  });

describe('guardas de sessão', () => {
  test('/ sem sessão vai para Entrar', async () => {
    mockApi(semSessao());
    const { router } = renderRoute('/');

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe('/entrar');
  });

  test('/ com uma escola abre a escola, e a escola com um perfil abre a casca', async () => {
    mockApi(comSessao(['professor']));
    const { router } = renderRoute('/');

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/professor'));
  });

  test('/ com mais de uma escola lista as escolas da conta', async () => {
    mockApi({
      ...comSessao(['responsavel']),
      '/api/v1/eu': {
        ...euCom(['responsavel']),
        escolas: [
          { slug: SLUG, nome: 'Colégio Recreio', perfis: ['responsavel'] },
          { slug: 'escola-aurora', nome: 'Escola Aurora', perfis: ['professor', 'coordenacao'] },
        ],
      },
    });
    renderRoute('/');

    const escolas = await screen.findByRole('list', { name: 'Escolas' });
    expect(
      within(escolas)
        .getAllByRole('link')
        .map((link) => link.getAttribute('href')),
    ).toEqual([naEscola(), '/escola-aurora']);
    expect(within(escolas).getByText('Professor, Escola')).toBeInTheDocument();
  });

  test('/ sem nenhuma escola explica o que falta', async () => {
    mockApi({ '/api/v1/eu': euCom([]) });
    renderRoute('/');

    expect(await screen.findByText('Sua conta ainda não tem escola')).toBeInTheDocument();
  });

  test('casca de perfil sem sessão vai para Entrar guardando o caminho de volta', async () => {
    mockApi(semSessao());
    const { router } = renderRoute(naEscola('/escola/alunos?turma=9A'));

    await screen.findByRole('heading', { name: 'Entrar' });
    expect(router.state.location.pathname).toBe(naEscola('/entrar'));
    expect(new URLSearchParams(router.state.location.search).get('voltar')).toBe(naEscola('/escola/alunos?turma=9A'));
  });

  test('casca sem vínculo que a libere volta para o perfil da pessoa', async () => {
    mockApi(comSessao(['responsavel']));
    const { router } = renderRoute(naEscola('/escola'));

    await encontrarMenus();
    expect(router.state.location.pathname).toBe(naEscola('/familia'));
  });

  test('conta sem vínculo com a escola vê o aviso e o botão de sair', async () => {
    mockApi({
      '/api/v1/eu': { ...euCom([]), escolas: [{ slug: 'escola-aurora', nome: 'Escola Aurora', perfis: ['aluno'] }] },
      [apiDaEscola('/publica')]: ESCOLA_PUBLICA,
    });
    const { router } = renderRoute(naEscola('/aluno'));

    expect(await screen.findByText('Sua conta não tem acesso a esta escola')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sair e entrar com outra conta' })).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(naEscola());
  });

  test('slug que não é de escola nenhuma mostra a página não encontrada', async () => {
    mockApi(comSessao(['aluno']));
    renderRoute('/escola-que-nao-existe');

    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
  });

  test('Entrar de um slug desconhecido avisa que a escola não existe', async () => {
    mockApi(semSessao());
    renderRoute('/escola-que-nao-existe/entrar');

    expect(await screen.findByText('Escola não encontrada')).toBeInTheDocument();
  });

  test('401 em qualquer consulta leva para Entrar com o caminho de volta', async () => {
    mockApi({
      ...comSessao(['direcao']),
      [apiDaEscola()]: () => naoAutenticado(apiDaEscola()),
      [apiDaEscola('/alunos')]: () => naoAutenticado(apiDaEscola('/alunos')),
    });
    const { router } = renderRoute(naEscola('/escola/alunos'));

    expect(await screen.findByRole('heading', { name: 'Entrar' })).toBeInTheDocument();
    expect(new URLSearchParams(router.state.location.search).get('voltar')).toBe(naEscola('/escola/alunos'));
  });

  test('preferências abrem sem sessão', async () => {
    mockApi(semSessao());
    renderRoute('/preferencias');

    expect(await screen.findByRole('heading', { name: 'Acessibilidade e leitura' })).toBeInTheDocument();
  });
});
