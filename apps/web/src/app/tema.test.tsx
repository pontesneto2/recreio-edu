import { schoolPalette } from '@recreio/design-system';
import { screen } from '@testing-library/react';
import { ESCOLA_PUBLICA, mockApi, renderRoute, semSessao, naEscola, apiDaEscola } from '@/test/render.tsx';

const corDaMarcaAplicada = () =>
  (document.querySelector('.rc-school-theme') as HTMLElement | null)?.style.getPropertyValue('--brand');

describe('tema da escola', () => {
  test('usa a cor cadastrada da escola, lida sem login', async () => {
    mockApi({ ...semSessao(), [apiDaEscola('/publica')]: { ...ESCOLA_PUBLICA, corMarca: '#7A1FA2' } });
    renderRoute(naEscola('/entrar'));

    await screen.findByRole('heading', { name: 'Entrar' });
    await vi.waitFor(() => expect(corDaMarcaAplicada()).toBe(schoolPalette('#7A1FA2').vars['--brand']));
  });

  test('fica no azul Recreio quando a API não responde', async () => {
    mockApi({});
    renderRoute(naEscola('/entrar'));

    await screen.findByRole('heading', { name: 'Entrar' });
    expect(corDaMarcaAplicada()).toBe(schoolPalette('#0067CC').vars['--brand']);
  });
});
