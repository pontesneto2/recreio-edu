import { problemSchema } from '@recreio/contracts';
import { createDocument, type ZodOpenApiPathsObject } from 'zod-openapi';
import { problemResponse } from './problem-responses.ts';
import type { ApiOperation, ApiPaths, OpenApiModule } from './registry.ts';

export const API_V1_PREFIX = '/api/v1';

/**
 * Toda operação pode responder 404 (Host sem escola), 429 (limite) e 500 (erro interno).
 * Operação com corpo também pode responder 413. O módulo não precisa repetir.
 */
const withCommonProblems = (operation: ApiOperation): ApiOperation => ({
  ...operation,
  responses: {
    404: problemResponse('NAO_ENCONTRADO'),
    ...(operation.requestBody ? { 413: problemResponse('CORPO_GRANDE_DEMAIS') } : {}),
    429: problemResponse('LIMITE_EXCEDIDO'),
    500: problemResponse('ERRO_INTERNO'),
    ...operation.responses,
  },
});

const mergePaths = (modules: OpenApiModule[]): ZodOpenApiPathsObject => {
  const paths: ApiPaths = {};
  for (const module of modules) {
    for (const [path, operations] of Object.entries(module.paths)) {
      if (paths[path]) throw new Error(`O caminho ${path} aparece em mais de um módulo do OpenAPI.`);
      paths[path] = Object.fromEntries(
        Object.entries(operations).map(([method, operation]) => [method, withCommonProblems(operation)]),
      );
    }
  }
  return paths;
};

/** Monta o documento OpenAPI 3.1 da versão 1 a partir das declarações de cada módulo. */
export const createOpenApiDocument = (modules: OpenApiModule[]) =>
  createDocument({
    openapi: '3.1.0',
    info: {
      title: 'API Recreio',
      version: '1.0.0',
      description:
        'API do Recreio Sistema Educacional. Erros seguem a RFC 9457 (`application/problem+json`) com o campo `code`. ' +
        'Toda resposta traz `X-Request-Id`.',
    },
    servers: [{ url: API_V1_PREFIX }],
    tags: modules.map((module) => module.tag),
    paths: mergePaths(modules),
    components: {
      schemas: Object.assign({ Problema: problemSchema }, ...modules.map((module) => module.schemas)),
    },
  });

export type OpenApiDocument = ReturnType<typeof createOpenApiDocument>;

/** Texto do arquivo versionado em `docs/api/openapi.json`. */
export const serializeOpenApi = (document: OpenApiDocument) => `${JSON.stringify(document, null, 2)}\n`;
