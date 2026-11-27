import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { mockApi, renderRoute } from '@/test/render.tsx';

describe('PreferenciasPage', () => {
  beforeEach(() => {
    mockApi({});
    window.localStorage.clear();
  });

  test('mostra o painel de acessibilidade e a prévia', async () => {
    renderRoute('/preferencias');

    expect(await screen.findByRole('heading', { name: 'Acessibilidade e leitura' })).toBeInTheDocument();
    expect(screen.getByText('Tamanho do texto')).toBeInTheDocument();
    expect(screen.getByRole('switch', { name: /Reduzir movimento/ })).toBeInTheDocument();
    expect(screen.getByText('Prévia ao vivo')).toBeInTheDocument();
  });

  test('aplica na hora e grava neste navegador ao salvar', async () => {
    renderRoute('/preferencias');

    await userEvent.click(await screen.findByRole('switch', { name: /Reduzir movimento/ }));
    expect(document.documentElement).toHaveAttribute('data-motion', 'reduzido');

    await userEvent.click(screen.getByRole('button', { name: 'Salvar preferências' }));

    await vi.waitFor(() =>
      expect(JSON.parse(window.localStorage.getItem('recreio.preferencias') ?? '{}')).toMatchObject({
        motion: 'reduzido',
      }),
    );
  });

  test('"Voltar" leva à escolha de perfil quando a página foi aberta direto', async () => {
    renderRoute('/preferencias');

    await userEvent.click(await screen.findByRole('button', { name: 'Voltar' }));

    expect(await screen.findByRole('heading', { name: 'Quem vai usar?' })).toBeInTheDocument();
  });
});
