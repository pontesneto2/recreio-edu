import { createQueryClient } from '@/shared/api/query-client.ts';
import { euCom, problemResponse } from '@/test/render.tsx';
import { euQuery } from './sessao.api.ts';
import { lerSessaoSalva, salvarSessao } from './sessao-salva.ts';

const semRede = () =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => {
      throw new TypeError('Failed to fetch');
    }),
  );

const buscar = () => {
  const queryClient = createQueryClient();
  queryClient.setDefaultOptions({ queries: { retry: false } });
  return queryClient.fetchQuery(euQuery);
};

describe('euQuery', () => {
  test('guarda a sessão lida para abrir sem conexão depois', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => Response.json(euCom(['responsavel']))),
    );
    await expect(buscar()).resolves.toMatchObject({ situacao: 'ativa' });
    expect(lerSessaoSalva()?.usuario.nome).toBe('Fernanda Lima');
  });

  test('sem conexão, usa a sessão salva', async () => {
    salvarSessao(euCom(['professor']));
    semRede();
    const sessao = await buscar();
    expect(sessao.situacao === 'ativa' && sessao.eu.escolas[0]?.perfis).toEqual(['professor']);
  });

  test('sem conexão e sem sessão salva, a consulta falha', async () => {
    semRede();
    await expect(buscar()).rejects.toBeInstanceOf(TypeError);
  });

  test('401 apaga a sessão salva', async () => {
    salvarSessao(euCom(['professor']));
    vi.stubGlobal(
      'fetch',
      vi.fn(async () =>
        problemResponse(401, {
          type: 'https://recreio.app/problemas/nao-autenticado',
          title: 'x',
          code: 'NAO_AUTENTICADO',
        }),
      ),
    );
    await expect(buscar()).resolves.toEqual({ situacao: 'anonima' });
    expect(lerSessaoSalva()).toBeUndefined();
  });
});
