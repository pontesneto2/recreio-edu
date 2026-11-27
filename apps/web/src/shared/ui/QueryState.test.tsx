import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { simularSemInternet } from '@/test/helpers.ts';
import { QueryState } from './QueryState.tsx';

type Turma = { id: string; nome: string };

const ListaDeTurmas = ({ buscar }: { buscar: () => Promise<Turma[]> }) => {
  const query = useQuery({ queryKey: ['turmas'], queryFn: buscar });
  return (
    <QueryState
      query={query}
      carregando="Carregando as turmas"
      erro={{ titulo: 'Não conseguimos carregar as turmas' }}
      vazio={{ titulo: 'Nenhuma turma cadastrada', texto: 'Cadastre a primeira turma em Secretaria.' }}
    >
      {(turmas) => (
        <ul>
          {turmas.map((turma) => (
            <li key={turma.id}>{turma.nome}</li>
          ))}
        </ul>
      )}
    </QueryState>
  );
};

const renderizar = (buscar: () => Promise<Turma[]>) => {
  const queryClient = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={queryClient}>
      <ListaDeTurmas buscar={buscar} />
    </QueryClientProvider>,
  );
};

describe('QueryState', () => {
  afterEach(() => vi.restoreAllMocks());

  test('mostra o esqueleto enquanto carrega', () => {
    renderizar(() => new Promise(() => {}));

    expect(screen.getByRole('status', { name: 'Carregando as turmas' })).toBeInTheDocument();
  });

  test('mostra o conteúdo quando há dado', async () => {
    renderizar(async () => [{ id: '9a', nome: '9º ano A' }]);

    expect(await screen.findByText('9º ano A')).toBeInTheDocument();
  });

  test('mostra o estado vazio para lista sem itens', async () => {
    renderizar(async () => []);

    expect(await screen.findByText('Nenhuma turma cadastrada')).toBeInTheDocument();
    expect(screen.getByText('Cadastre a primeira turma em Secretaria.')).toBeInTheDocument();
  });

  test('mostra o erro e tenta de novo', async () => {
    const buscar = vi
      .fn<() => Promise<Turma[]>>()
      .mockRejectedValueOnce(new Error('/api/turmas respondeu 500'))
      .mockResolvedValueOnce([{ id: '9b', nome: '9º ano B' }]);
    renderizar(buscar);

    expect(await screen.findByText('Não conseguimos carregar as turmas')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Tentar de novo' }));

    expect(await screen.findByText('9º ano B')).toBeInTheDocument();
    expect(buscar).toHaveBeenCalledTimes(2);
  });

  test('sem conexão, o erro diz que o aparelho está offline', async () => {
    simularSemInternet();
    renderizar(async () => {
      throw new Error('Failed to fetch');
    });

    expect(await screen.findByText('Você está sem conexão')).toBeInTheDocument();
  });
});
