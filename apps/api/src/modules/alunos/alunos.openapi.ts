import { alunoSchema } from '@recreio/contracts';
import { problemResponse } from '../../shared/openapi/problem-responses.ts';
import { defineOpenApiModule } from '../../shared/openapi/registry.ts';
import { alunoParamsSchema } from './alunos.controller.ts';

export const alunosOpenApi = defineOpenApiModule({
  tag: { name: 'Alunos', description: 'Alunos matriculados na escola.' },
  schemas: { Aluno: alunoSchema },
  paths: {
    '/alunos': {
      get: {
        operationId: 'listarAlunos',
        summary: 'Lista os alunos',
        tags: ['Alunos'],
        responses: {
          200: {
            description: 'Todos os alunos da escola.',
            content: { 'application/json': { schema: alunoSchema.array() } },
          },
        },
      },
    },
    '/alunos/{id}': {
      get: {
        operationId: 'buscarAluno',
        summary: 'Busca um aluno pelo id',
        tags: ['Alunos'],
        requestParams: { path: alunoParamsSchema },
        responses: {
          200: {
            description: 'O aluno.',
            content: { 'application/json': { schema: alunoSchema } },
          },
          400: problemResponse('DADOS_INVALIDOS'),
          404: problemResponse('NAO_ENCONTRADO'),
        },
      },
    },
  },
});
