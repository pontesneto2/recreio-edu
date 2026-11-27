import { problemSchema } from '@recreio/contracts';
import type { z } from 'zod';

type ApiErrorFields = {
  status: number;
  code: string;
  title: string;
  detail?: string;
  errors?: Record<string, string[]>;
};

/** Erro de uma chamada à API. O portal decide o que mostrar por `code`, que não muda entre versões do texto. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly title: string;
  readonly detail?: string;
  readonly errors?: Record<string, string[]>;

  constructor({ status, code, title, detail, errors }: ApiErrorFields) {
    super(detail ?? title);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.title = title;
    this.detail = detail;
    this.errors = errors;
  }
}

/** Lê o corpo RFC 9457 da resposta. Sem ele (proxy fora do ar, HTML de erro), usa o código `ERRO_HTTP`. */
const toApiError = async (path: string, res: Response): Promise<ApiError> => {
  const problem = problemSchema.safeParse(await res.json().catch(() => undefined));
  if (problem.success) return new ApiError(problem.data);
  return new ApiError({
    status: res.status,
    code: 'ERRO_HTTP',
    title: res.statusText || 'Erro HTTP',
    detail: `${path} respondeu ${res.status}`,
  });
};

/** Faz GET em `/api/v1/...` e valida a resposta com o schema do contrato. */
export const getJson = async <S extends z.ZodType>(path: string, schema: S): Promise<z.infer<S>> => {
  const res = await fetch(path, { headers: { Accept: 'application/json, application/problem+json' } });
  if (!res.ok) throw await toApiError(path, res);
  return schema.parse(await res.json());
};
