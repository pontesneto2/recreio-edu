import { type ProblemCode, problemSchema } from '@recreio/contracts';
import { z } from 'zod';
import type { ZodOpenApiResponseObject } from 'zod-openapi';
import { createProblem, PROBLEM_CONTENT_TYPE } from '../http/problem.ts';

type ProblemResponseSpec = {
  id: string;
  description: string;
  example: Parameters<typeof createProblem>[1];
  headers?: ZodOpenApiResponseObject['headers'];
};

const rateLimitHeaders = z.object({
  'Retry-After': z.int().min(0).meta({ description: 'Segundos até a janela do limite reiniciar.' }),
  RateLimit: z.string().meta({ description: 'Requisições restantes e segundos até reiniciar (draft 8 da IETF).' }),
  'RateLimit-Policy': z.string().meta({ description: 'Cota e janela do limite (draft 8 da IETF).' }),
});

const specs: Record<ProblemCode, ProblemResponseSpec> = {
  DADOS_INVALIDOS: {
    id: 'DadosInvalidos',
    description: 'A entrada não segue o schema do contrato.',
    example: {
      detail: 'Os dados enviados não são válidos.',
      instance: '/api/v1/escolas/colegio-recreio/alunos/ID%20Inv%C3%A1lido',
      errors: { id: ['Formato do UUID inválido'] },
    },
  },
  NAO_AUTENTICADO: {
    id: 'NaoAutenticado',
    description: 'A requisição não trouxe o cookie de sessão, ou a sessão expirou. Entre de novo.',
    example: { detail: 'Sessão ausente ou expirada. Entre de novo para continuar.', instance: '/api/v1/eu' },
  },
  SEM_ACESSO: {
    id: 'SemAcesso',
    description: 'A sessão é válida, mas a conta não tem vínculo com a escola da rota.',
    example: {
      detail: 'A conta não tem vínculo com esta escola.',
      instance: '/api/v1/escolas/colegio-recreio/alunos',
    },
  },
  PERMISSAO_NEGADA: {
    id: 'PermissaoNegada',
    description: 'Nenhum perfil da conta nesta escola tem a ação pedida no módulo.',
    example: {
      detail: 'Os perfis da conta não têm a ação "ver" no módulo "alunos".',
      instance: '/api/v1/escolas/colegio-recreio/alunos',
    },
  },
  NAO_ENCONTRADO: {
    id: 'NaoEncontrado',
    description: 'O recurso não existe, ou o slug da rota não pertence a nenhuma escola.',
    example: {
      detail: 'Aluno não encontrado.',
      instance: '/api/v1/escolas/colegio-recreio/alunos/7a1e2b3c-0000-4000-8000-000000000000',
    },
  },
  CORPO_GRANDE_DEMAIS: {
    id: 'CorpoGrandeDemais',
    description: 'O corpo da requisição passa do limite aceito pela API.',
    example: { detail: 'O corpo da requisição passa do limite de 1024 KB.', instance: '/api/v1/alunos' },
  },
  LIMITE_EXCEDIDO: {
    id: 'LimiteExcedido',
    description: 'O cliente passou do limite de requisições por minuto.',
    example: {
      detail: 'Limite de 300 requisições por minuto excedido. Tente de novo após o tempo de Retry-After.',
      instance: '/api/v1/escolas/colegio-recreio/alunos',
    },
    headers: rateLimitHeaders,
  },
  ERRO_INTERNO: {
    id: 'ErroInterno',
    description: 'Erro não previsto. O detalhe fica só no log, ligado ao X-Request-Id.',
    example: {
      detail: 'Erro interno. Tente de novo em instantes.',
      instance: '/api/v1/escolas/colegio-recreio/alunos',
    },
  },
};

const cache = new Map<ProblemCode, ZodOpenApiResponseObject>();

/**
 * Resposta `application/problem+json` de um código do catálogo, registrada como componente.
 * Devolve sempre o mesmo objeto por código, porque o zod-openapi aceita cada `id` uma vez só.
 */
export const problemResponse = (code: ProblemCode): ZodOpenApiResponseObject => {
  const cached = cache.get(code);
  if (cached) return cached;
  const { id, description, example, headers } = specs[code];
  const response: ZodOpenApiResponseObject = {
    id,
    description,
    headers,
    content: { [PROBLEM_CONTENT_TYPE]: { schema: problemSchema, example: createProblem(code, example) } },
  };
  cache.set(code, response);
  return response;
};

/**
 * 403 de rota protegida por permissão. A conta pode não ter vínculo com a escola (`SEM_ACESSO`)
 * ou ter vínculo sem a ação pedida (`PERMISSAO_NEGADA`). O cliente distingue pelo `code`.
 */
export const acessoNegadoResponse: ZodOpenApiResponseObject = {
  id: 'AcessoNegado',
  description: 'A conta não tem vínculo com a escola (`SEM_ACESSO`) ou não tem a permissão (`PERMISSAO_NEGADA`).',
  content: {
    [PROBLEM_CONTENT_TYPE]: {
      schema: problemSchema,
      examples: {
        SEM_ACESSO: { value: createProblem('SEM_ACESSO', specs.SEM_ACESSO.example) },
        PERMISSAO_NEGADA: { value: createProblem('PERMISSAO_NEGADA', specs.PERMISSAO_NEGADA.example) },
      },
    },
  },
};
