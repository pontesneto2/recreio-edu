import { QueryCache, QueryClient } from '@tanstack/react-query';
import { apagarSessaoSalva } from '../sessao/sessao-salva.ts';
import { sessaoKeys } from '../sessao/sessao.api.ts';
import { ApiError } from './http-client.ts';

/** Novas tentativas depois da primeira falha. */
const MAX_RETRIES = 2;

/**
 * Erro 4xx da API não muda com nova tentativa (dado inválido, recurso ausente, limite excedido).
 * Erro 5xx e falha de rede tentam de novo até `MAX_RETRIES` vezes.
 */
export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status < 500) && failureCount < MAX_RETRIES;

export const createQueryClient = () => {
  const queryClient: QueryClient = new QueryClient({
    // Sessão expirada em qualquer consulta: a casca do perfil leva para Entrar com o caminho de volta.
    queryCache: new QueryCache({
      onError: (erro, query) => {
        if (erro instanceof ApiError && erro.status === 401 && query.queryKey[0] !== sessaoKeys.eu[0]) {
          apagarSessaoSalva();
          queryClient.setQueryData(sessaoKeys.eu, { situacao: 'anonima' });
        }
      },
    }),
    defaultOptions: {
      queries: { staleTime: 60_000, retry: shouldRetry },
    },
  });
  return queryClient;
};
