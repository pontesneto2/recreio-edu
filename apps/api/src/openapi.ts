import { alunosOpenApi } from './modules/alunos/alunos.openapi.ts';
import { escolaOpenApi } from './modules/escola/escola.openapi.ts';
import { createOpenApiDocument } from './shared/openapi/document.ts';

/** Documento OpenAPI da v1. Um módulo novo entra nesta lista junto com a rota em `app.ts`. */
export const openApiDocument = createOpenApiDocument([escolaOpenApi, alunosOpenApi]);

/** Cópia versionada do documento, conferida por `openapi.test.ts`. */
export const OPENAPI_SNAPSHOT_URL = new URL('../../../docs/api/openapi.json', import.meta.url);
