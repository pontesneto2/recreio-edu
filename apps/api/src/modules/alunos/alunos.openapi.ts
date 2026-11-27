import { alunoSchema } from '@recreio/contracts';
import { acessoNegadoResponse, problemResponse } from '../../shared/openapi/problem-responses.ts';
import { defineOpenApiModule, escolaParamsSchema, SESSAO_EXIGIDA } from '../../shared/openapi/registry.ts';
import { alunoParamsSchema } from './alunos.controller.ts';

export const alunosOpenApi = defineOpenApiModule({
  tag: { name: 'Alunos', description: 'Alunos matriculados na escola. Exige a permissão `alunos:ver`.' },
  schemas: { Aluno: alunoSchema },
  paths: {
    '/escolas/{escola}/alunos': {
      get: {
        operationId: 'listarAlunos',
        summary: 'Lista os alunos',
        tags: ['Alunos'],
        security: SESSAO_EXIGIDA,
        requestParams: { path: escolaParamsSchema },
        responses: {
          200: {
            description: 'Todos os alunos da escola.',
            content: { 'application/json': { schema: alunoSchema.array() } },
          },
          401: problemResponse('NAO_AUTENTICADO'),
          403: acessoNegadoResponse,
        },
      },
    },
    '/escolas/{escola}/alunos/{id}': {
      get: {
        operationId: 'buscarAluno',
        summary: 'Busca um aluno pelo id',
        tags: ['Alunos'],
        security: SESSAO_EXIGIDA,
        requestParams: { path: escolaParamsSchema.extend(alunoParamsSchema.shape) },
        responses: {
          200: {
            description: 'O aluno.',
            content: { 'application/json': { schema: alunoSchema } },
          },
          400: problemResponse('DADOS_INVALIDOS'),
          401: problemResponse('NAO_AUTENTICADO'),
          403: acessoNegadoResponse,
          404: problemResponse('NAO_ENCONTRADO'),
        },
      },
    },
  },
});
