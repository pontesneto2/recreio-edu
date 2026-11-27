import type { ProblemCode } from '@recreio/contracts';

export const PROBLEM_TYPE_BASE_URL = 'https://recreio.app/problemas';

export type ProblemType = {
  status: number;
  title: string;
  slug: string;
};

/** Catálogo de erros da API. Cada código tem um status HTTP e uma URL `type` fixos. */
export const problemTypes = {
  DADOS_INVALIDOS: { status: 400, title: 'Dados inválidos', slug: 'dados-invalidos' },
  NAO_AUTENTICADO: { status: 401, title: 'Sessão ausente ou expirada', slug: 'nao-autenticado' },
  SEM_ACESSO: { status: 403, title: 'Sem acesso a esta escola', slug: 'sem-acesso' },
  PERMISSAO_NEGADA: { status: 403, title: 'Permissão negada', slug: 'permissao-negada' },
  NAO_ENCONTRADO: { status: 404, title: 'Recurso não encontrado', slug: 'nao-encontrado' },
  CORPO_GRANDE_DEMAIS: { status: 413, title: 'Corpo da requisição grande demais', slug: 'corpo-grande-demais' },
  LIMITE_EXCEDIDO: { status: 429, title: 'Limite de requisições excedido', slug: 'limite-excedido' },
  ERRO_INTERNO: { status: 500, title: 'Erro interno', slug: 'erro-interno' },
} as const satisfies Record<ProblemCode, ProblemType>;

export const problemTypeUrl = (code: ProblemCode) => `${PROBLEM_TYPE_BASE_URL}/${problemTypes[code].slug}`;
