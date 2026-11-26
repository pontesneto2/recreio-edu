import type { z } from 'zod';

/** Erro de uma chamada à API, com o código estável que a API devolve em `erro.codigo`. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;

  constructor(message: string, status: number, code: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
  }
}

type ErrorBody = { erro?: { codigo?: string; mensagem?: string } };

/** Faz GET em `/api/...` e valida a resposta com o schema do contrato. */
export const getJson = async <S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> => {
  const res = await fetch(path, { headers: { Accept: 'application/json' } });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as ErrorBody;
    throw new ApiError(
      body.erro?.mensagem ?? `${path} respondeu ${res.status}`,
      res.status,
      body.erro?.codigo ?? 'ERRO_HTTP',
    );
  }
  return schema.parse(await res.json());
};
