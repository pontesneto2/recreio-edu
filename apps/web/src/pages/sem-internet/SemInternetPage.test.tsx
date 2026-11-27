import { screen, within } from '@testing-library/react';
import { simularSemInternet } from '@/test/helpers.ts';
import { mockApi, renderRoute } from '@/test/render.tsx';

describe('SemInternetPage', () => {
  beforeEach(() => mockApi({}));
  afterEach(() => vi.restoreAllMocks());

  test('sem conexão, separa o que funciona do que espera a internet', async () => {
    simularSemInternet();
    renderRoute('/sem-internet');

    expect(await screen.findByRole('heading', { name: 'Modo sem internet' })).toBeInTheDocument();
    expect(screen.getByText('O essencial continua aqui')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();

    const precisa = screen.getByRole('list', { name: 'Precisa de internet' });
    expect(within(precisa).getByText('Pagar com Pix')).toBeInTheDocument();
    expect(within(precisa).getAllByText('Indisponível')).toHaveLength(3);
    // A faixa de aviso não se repete na própria tela de sem internet.
    expect(screen.queryByText('Sem internet')).not.toBeInTheDocument();
  });

  test('com a conexão de volta, oferece voltar ao início', async () => {
    renderRoute('/sem-internet');

    expect(await screen.findByText('A conexão voltou. As telas já carregam dados novos.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Voltar ao início' })).toBeInTheDocument();
  });
});
