import { QueryClient } from '@tanstack/react-query';
import { ApiError } from './http-client.ts';

/** Novas tentativas depois da primeira falha. */
const MAX_RETRIES = 2;

/**
 * Erro 4xx da API não muda com nova tentativa (dado inválido, recurso ausente, limite excedido).
 * Erro 5xx e falha de rede tentam de novo até `MAX_RETRIES` vezes.
 */
export const shouldRetry = (failureCount: number, error: unknown) =>
  !(error instanceof ApiError && error.status < 500) && failureCount < MAX_RETRIES;

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60_000, retry: shouldRetry },
    },
  });
