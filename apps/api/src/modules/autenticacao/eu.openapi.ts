import { euSchema } from '@recreio/contracts';
import { problemResponse } from '../../shared/openapi/problem-responses.ts';
import { defineOpenApiModule, SESSAO_EXIGIDA } from '../../shared/openapi/registry.ts';

export const euOpenApi = defineOpenApiModule({
  tag: {
    name: 'Sessão',
    description:
      'Quem está logado. Entrar, sair e trocar senha ficam em `/api/auth/*`, rotas do Better Auth fora deste documento.',
  },
  schemas: { Eu: euSchema },
  paths: {
    '/eu': {
      get: {
        operationId: 'obterEu',
        summary: 'Obtém a pessoa logada e os vínculos dela em cada escola',
        tags: ['Sessão'],
        security: SESSAO_EXIGIDA,
        responses: {
          200: {
            description:
              'A pessoa e as escolas em que tem vínculo, com os perfis em cada uma. Lista vazia sem vínculo.',
            content: { 'application/json': { schema: euSchema } },
          },
          401: problemResponse('NAO_AUTENTICADO'),
        },
      },
    },
  },
});
