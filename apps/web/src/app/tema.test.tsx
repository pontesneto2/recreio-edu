import { schoolPalette } from '@recreio/design-system';
import { screen } from '@testing-library/react';
import { mockApi, renderRoute } from '@/test/render.tsx';

const escola = (corMarca: string) => ({
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca,
  hoje: '2026-11-25',
  unidades: [{ id: 'aldeota', nome: 'Unidade Aldeota', alunos: 1248 }],
});

const corDaMarcaAplicada = () =>
  (document.querySelector('.rc-school-theme') as HTMLElement | null)?.style.getPropertyValue('--brand');

describe('tema da escola', () => {
  test('usa a cor cadastrada da escola', async () => {
    mockApi({ '/api/v1/escola': escola('#7A1FA2') });
    renderRoute('/');

    await screen.findByRole('heading', { name: 'Quem vai usar?' });
    await vi.waitFor(() => expect(corDaMarcaAplicada()).toBe(schoolPalette('#7A1FA2').vars['--brand']));
  });

  test('fica no azul Recreio quando a API não responde', async () => {
    mockApi({});
    renderRoute('/');

    await screen.findByRole('heading', { name: 'Quem vai usar?' });
    expect(corDaMarcaAplicada()).toBe(schoolPalette('#0067CC').vars['--brand']);
  });
});
