import { screen } from '@testing-library/react';
import { mockApi, renderRoute } from '@/test/render.tsx';

const escola = {
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca: '#0067CC',
  hoje: '2026-11-25',
  unidades: [{ id: 'aldeota', nome: 'Unidade Aldeota', alunos: 1248 }],
};

const alunos = [
  { id: 'davi', nome: 'Davi Lima', turma: '2º ano B', turno: 'Manhã', matricula: '2024-0318', mensalidade: 1480 },
];

describe('InicioPage', () => {
  test('mostra unidades e alunos vindos da API', async () => {
    mockApi({ '/api/v1/escola': escola, '/api/v1/alunos': alunos });
    renderRoute('/escola');

    expect(await screen.findByText('Davi Lima')).toBeInTheDocument();
    expect(screen.getByText('Alunos · Unidade Aldeota')).toBeInTheDocument();
  });

  test('avisa quando a API de alunos falha', async () => {
    mockApi({ '/api/v1/escola': escola });
    renderRoute('/escola');

    expect(await screen.findByText('Não conseguimos carregar os alunos')).toBeInTheDocument();
  });

  test('avisa quando a API da escola falha', async () => {
    mockApi({ '/api/v1/alunos': alunos });
    renderRoute('/escola');

    expect(await screen.findByText('Não conseguimos carregar as unidades')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  test('mostra o estado vazio quando a escola não tem unidade', async () => {
    mockApi({ '/api/v1/escola': { ...escola, unidades: [] }, '/api/v1/alunos': alunos });
    renderRoute('/escola');

    expect(await screen.findByText('Nenhuma unidade cadastrada')).toBeInTheDocument();
  });
});
