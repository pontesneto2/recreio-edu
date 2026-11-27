import { escolaSchema } from '@recreio/contracts';
import { defineOpenApiModule } from '../../shared/openapi/registry.ts';

export const escolaOpenApi = defineOpenApiModule({
  tag: { name: 'Escola', description: 'Dados da escola e das unidades.' },
  schemas: { Escola: escolaSchema },
  paths: {
    '/escola': {
      get: {
        operationId: 'obterEscola',
        summary: 'Obtém os dados da escola',
        tags: ['Escola'],
        responses: {
          200: {
            description: 'Dados da escola, com as unidades.',
            content: { 'application/json': { schema: escolaSchema } },
          },
        },
      },
    },
  },
});
