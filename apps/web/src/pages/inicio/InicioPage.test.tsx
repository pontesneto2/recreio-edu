import { screen } from '@testing-library/react';
import { comSessao, mockApi, problemResponse, renderRoute, naEscola, apiDaEscola } from '@/test/render.tsx';

const escola = {
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca: '#0067CC',
  hoje: '2026-11-25',
  unidades: [{ id: '6f1c1c1e-2b7d-4c3a-8e9f-1a2b3c4d5e6f', nome: 'Unidade Aldeota', alunos: 1248 }],
};

const alunos = [
  {
    id: '0d4b7a52-6c1e-4f0a-9d3b-2f5e8c7a0318',
    nome: 'Davi Lima',
    turma: '2º ano B',
    turno: 'Manhã',
    matricula: '2024-0318',
    mensalidadeCentavos: 148000,
  },
];

describe('InicioPage', () => {
  test('mostra unidades e alunos vindos da API', async () => {
    mockApi({ ...comSessao(['direcao']), [apiDaEscola()]: escola, [apiDaEscola('/alunos')]: alunos });
    renderRoute(naEscola('/escola'));

    expect(await screen.findByText('Davi Lima')).toBeInTheDocument();
    expect(screen.getByText('Alunos · Unidade Aldeota')).toBeInTheDocument();
  });

  test('avisa quando a API de alunos falha', async () => {
    mockApi({ ...comSessao(['direcao']), [apiDaEscola()]: escola });
    renderRoute(naEscola('/escola'));

    expect(await screen.findByText('Não conseguimos carregar os alunos')).toBeInTheDocument();
  });

  test('avisa quando a API da escola falha', async () => {
    mockApi({ ...comSessao(['direcao']), [apiDaEscola('/alunos')]: alunos });
    renderRoute(naEscola('/escola'));

    expect(await screen.findByText('Não conseguimos carregar as unidades')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar de novo' })).toBeInTheDocument();
  });

  test('mostra o estado vazio quando a escola não tem unidade', async () => {
    mockApi({
      ...comSessao(['direcao']),
      [apiDaEscola()]: { ...escola, unidades: [] },
      [apiDaEscola('/alunos')]: alunos,
    });
    renderRoute(naEscola('/escola'));

    expect(await screen.findByText('Nenhuma unidade cadastrada')).toBeInTheDocument();
  });

  test('perfil sem permissão vê o aviso no lugar dos dados', async () => {
    const permissaoNegada = () =>
      problemResponse(403, {
        type: 'https://recreio.app/problemas/permissao-negada',
        title: 'Permissão negada',
        code: 'PERMISSAO_NEGADA',
      });
    mockApi({
      ...comSessao(['portaria'], 'Francisco Araújo'),
      [apiDaEscola()]: permissaoNegada,
      [apiDaEscola('/alunos')]: permissaoNegada,
    });
    renderRoute(naEscola('/escola'));

    await vi.waitFor(() => expect(screen.getAllByText('Seu perfil não vê esta informação')).toHaveLength(2));
    expect(screen.queryByText('Davi Lima')).not.toBeInTheDocument();
  });
});
