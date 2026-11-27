import { escolaPublicaSchema, escolaSchema } from '@recreio/contracts';
import { acessoNegadoResponse, problemResponse } from '../../shared/openapi/problem-responses.ts';
import { defineOpenApiModule, escolaParamsSchema, SESSAO_EXIGIDA } from '../../shared/openapi/registry.ts';

export const escolaOpenApi = defineOpenApiModule({
  tag: { name: 'Escola', description: 'Dados da escola e das unidades.' },
  schemas: { Escola: escolaSchema, EscolaPublica: escolaPublicaSchema },
  paths: {
    '/escolas/{escola}': {
      get: {
        operationId: 'obterEscola',
        summary: 'Obtém os dados da escola',
        description: 'Exige a permissão `painel:ver`.',
        tags: ['Escola'],
        requestParams: { path: escolaParamsSchema },
        security: SESSAO_EXIGIDA,
        responses: {
          200: {
            description: 'Dados da escola, com as unidades.',
            content: { 'application/json': { schema: escolaSchema } },
          },
          401: problemResponse('NAO_AUTENTICADO'),
          403: acessoNegadoResponse,
        },
      },
    },
    '/escolas/{escola}/publica': {
      get: {
        operationId: 'obterEscolaPublica',
        summary: 'Obtém nome, cidade e cor da escola, sem login',
        description: 'Aberta, porque a tela de entrada mostra a escola antes do login.',
        tags: ['Escola'],
        requestParams: { path: escolaParamsSchema },
        security: [],
        responses: {
          200: {
            description: 'Dados públicos da escola do slug.',
            content: { 'application/json': { schema: escolaPublicaSchema } },
          },
        },
      },
    },
  },
});
