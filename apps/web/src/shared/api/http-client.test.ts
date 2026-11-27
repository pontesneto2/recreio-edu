import { z } from 'zod';
import { problemResponse } from '@/test/render.tsx';
import { ApiError, getJson } from './http-client.ts';

const stubFetch = (response: Response) =>
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => response),
  );

const rejection = (promise: Promise<unknown>) =>
  promise.then(
    () => expect.fail('esperava erro'),
    (error: unknown) => error,
  );

describe('getJson', () => {
  test('devolve a resposta validada pelo schema', async () => {
    stubFetch(Response.json({ nome: 'Colégio Recreio' }));
    await expect(getJson('/api/v1/escola', z.object({ nome: z.string() }))).resolves.toEqual({
      nome: 'Colégio Recreio',
    });
  });

  test('lê o problem+json da API em ApiError', async () => {
    stubFetch(
      problemResponse(400, {
        type: 'https://recreio.app/problemas/dados-invalidos',
        title: 'Dados inválidos',
        detail: 'Os dados enviados não são válidos.',
        instance: '/api/v1/alunos/x',
        code: 'DADOS_INVALIDOS',
        errors: { id: ['Texto inválido'] },
      }),
    );

    const error = await rejection(getJson('/api/v1/alunos/x', z.unknown()));

    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({
      status: 400,
      code: 'DADOS_INVALIDOS',
      title: 'Dados inválidos',
      detail: 'Os dados enviados não são válidos.',
      message: 'Os dados enviados não são válidos.',
      errors: { id: ['Texto inválido'] },
    });
  });

  test('usa ERRO_HTTP quando o corpo não é problem+json', async () => {
    stubFetch(new Response('<html>Bad Gateway</html>', { status: 502, statusText: 'Bad Gateway' }));

    const error = await rejection(getJson('/api/v1/escola', z.unknown()));

    expect(error).toMatchObject({
      status: 502,
      code: 'ERRO_HTTP',
      title: 'Bad Gateway',
      detail: '/api/v1/escola respondeu 502',
    });
  });
});
