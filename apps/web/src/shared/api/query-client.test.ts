import { ApiError } from './http-client.ts';
import { createQueryClient, shouldRetry } from './query-client.ts';

const apiError = (status: number) => new ApiError({ status, code: 'X', title: 'Erro' });

describe('retry do QueryClient', () => {
  test('não tenta de novo erro 4xx da API', () => {
    for (const status of [400, 401, 403, 404, 413, 429]) {
      expect(shouldRetry(0, apiError(status)), String(status)).toBe(false);
    }
  });

  test('tenta de novo erro 5xx e falha de rede até 2 vezes', () => {
    for (const error of [apiError(500), apiError(503), new TypeError('Failed to fetch')]) {
      expect(shouldRetry(0, error)).toBe(true);
      expect(shouldRetry(1, error)).toBe(true);
      expect(shouldRetry(2, error)).toBe(false);
    }
  });

  test('uma consulta com 404 chama o fetch uma vez só', async () => {
    const client = createQueryClient();
    const queryFn = vi.fn(async () => {
      throw apiError(404);
    });

    await expect(client.fetchQuery({ queryKey: ['x'], queryFn, retryDelay: 0 })).rejects.toBeInstanceOf(ApiError);
    expect(queryFn).toHaveBeenCalledTimes(1);
  });

  test('uma consulta com 503 chama o fetch 3 vezes', async () => {
    const client = createQueryClient();
    const queryFn = vi.fn(async () => {
      throw apiError(503);
    });

    await expect(client.fetchQuery({ queryKey: ['y'], queryFn, retryDelay: 0 })).rejects.toBeInstanceOf(ApiError);
    expect(queryFn).toHaveBeenCalledTimes(3);
  });
});
