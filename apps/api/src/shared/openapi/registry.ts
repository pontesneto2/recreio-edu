import { slugDaEscolaSchema } from '@recreio/contracts';
import { z } from 'zod';
import type { ZodOpenApiOperationObject, oas31 } from 'zod-openapi';

export type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

/** Operação documentada. Sem `operationId`, `summary` e `tags` o typecheck falha. */
export type ApiOperation = ZodOpenApiOperationObject & {
  operationId: string;
  summary: string;
  tags: [string, ...string[]];
};

/** Caminhos relativos a `/api/v1`, no formato do OpenAPI (`/alunos/{id}`). */
export type ApiPaths = Record<string, Partial<Record<HttpMethod, ApiOperation>>>;

/** O que cada módulo publica no OpenAPI: a tag, os schemas com nome e as operações. */
export type OpenApiModule = {
  tag: oas31.TagObject;
  schemas: Record<string, z.ZodType>;
  paths: ApiPaths;
};

export const defineOpenApiModule = (module: OpenApiModule): OpenApiModule => module;

/** Nome do esquema de segurança do cookie de sessão em `components.securitySchemes`. */
export const ESQUEMA_DA_SESSAO = 'cookieAuth';

/** `security` de operação que exige o cookie de sessão do Better Auth. */
export const SESSAO_EXIGIDA = [{ [ESQUEMA_DA_SESSAO]: [] }];

/** Parâmetro `{escola}` das rotas da escola (ADR 0011). */
export const escolaParamsSchema = z.object({
  escola: slugDaEscolaSchema.meta({ description: 'Slug da escola, como `colegio-recreio`.' }),
});
