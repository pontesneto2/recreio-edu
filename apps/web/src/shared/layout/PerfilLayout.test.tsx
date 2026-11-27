import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NAVEGACOES, PERFIS } from '@/shared/config/navigation/index.ts';
import { encontrarMenus, simularSemInternet } from '@/test/helpers.ts';
import { mockApi, renderRoute } from '@/test/render.tsx';

const CASOS = PERFIS.map((perfil) => [perfil, NAVEGACOES[perfil]] as const);

describe('PerfilLayout', () => {
  beforeEach(() => mockApi({}));
  afterEach(() => vi.restoreAllMocks());

  test.each(CASOS)('%s mostra os grupos e itens do próprio menu', async (_perfil, navegacao) => {
    renderRoute(navegacao.base);
    const { menuLateral } = await encontrarMenus();

    for (const grupo of navegacao.grupos) {
      if (grupo.label) expect(within(menuLateral).getByText(grupo.label)).toBeInTheDocument();
      for (const item of grupo.items) {
        expect(within(menuLateral).getAllByRole('link', { name: item.label }).length).toBeGreaterThan(0);
      }
    }
  });

  test.each(CASOS)('%s marca a entrada como ativa e tem barra inferior com "Mais"', async (_perfil, navegacao) => {
    renderRoute(navegacao.base);
    const { menuLateral, barraInferior } = await encontrarMenus();
    const entrada = navegacao.grupos[0]!.items[0]!;

    expect(within(menuLateral).getByRole('link', { name: entrada.label })).toHaveAttribute('aria-current', 'page');
    expect(within(barraInferior).getAllByRole('link')).toHaveLength(5);
    expect(within(barraInferior).getByRole('link', { name: 'Mais' })).toBeInTheDocument();
  });

  test('o menu de um perfil não mostra itens de outro', async () => {
    renderRoute('/aluno');
    const { menuLateral } = await encontrarMenus();

    expect(within(menuLateral).getByRole('link', { name: 'Carteirinha e acessos' })).toBeInTheDocument();
    expect(within(menuLateral).queryByRole('link', { name: 'Mensalidades' })).not.toBeInTheDocument();
  });

  test('item do menu leva à rota dele e passa a ficar ativo', async () => {
    renderRoute('/escola');
    const { menuLateral } = await encontrarMenus();

    await userEvent.click(within(menuLateral).getByRole('link', { name: 'Chamada' }));

    expect(await screen.findByRole('heading', { name: 'Chamada' })).toBeInTheDocument();
    expect(within(menuLateral).getByRole('link', { name: 'Chamada' })).toHaveAttribute('aria-current', 'page');
  });

  test('"Mais" na barra inferior abre o menu inteiro do perfil', async () => {
    renderRoute('/familia');
    const { barraInferior } = await encontrarMenus();

    await userEvent.click(within(barraInferior).getByRole('link', { name: 'Mais' }));

    expect(await screen.findByRole('heading', { name: 'Mais' })).toBeInTheDocument();
    expect(screen.getByRole('list', { name: 'Serviços' })).toBeInTheDocument();
    expect(within(barraInferior).getByRole('link', { name: 'Mais' })).toHaveAttribute('aria-current', 'page');
  });

  test('sem internet, avisa no topo e leva à tela do modo sem internet', async () => {
    simularSemInternet();
    renderRoute('/professor');

    expect(await screen.findByText('Sem internet')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Ver o que funciona sem internet' }));

    expect(await screen.findByRole('heading', { name: 'Modo sem internet' })).toBeInTheDocument();
  });

  test('rota desconhecida dentro do perfil mostra a página não encontrada', async () => {
    renderRoute('/familia/nao-existe');

    expect(await screen.findByText('Página não encontrada')).toBeInTheDocument();
  });
});
