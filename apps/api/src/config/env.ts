import { z } from 'zod';

/** Valores do docker-compose.yml. Valem fora de produção quando a variável não existe. */
const PADRAO_LOCAL = {
  DATABASE_URL: 'postgres://recreio_app:recreio_app@localhost:5432/recreio',
  DATABASE_MIGRATION_URL: 'postgres://recreio:recreio@localhost:5432/recreio',
} as const;

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce.number().int().positive().default(3333),
    CORS_ORIGIN: z.url().default('http://localhost:5173'),
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
    /** Requisições por minuto por IP em `/api/v1`. Em NODE_ENV=test o limite fica desligado. */
    RATE_LIMIT_PER_MINUTE: z.coerce.number().int().positive().default(300),
    /** Conexão da API como recreio_app, sujeita às políticas de RLS. */
    DATABASE_URL: z.url().optional(),
    /** Conexão das migrações e do seed como recreio, dono das tabelas. */
    DATABASE_MIGRATION_URL: z.url().optional(),
    /** Escola atendida quando o Host é localhost ou 127.0.0.1, fora de produção (ADR 0006). */
    DEV_ESCOLA_DOMINIO: z.string().trim().toLowerCase().min(1).default('colegiorecreio.localhost'),
  })
  .transform((raw, ctx) => {
    for (const chave of ['DATABASE_URL', 'DATABASE_MIGRATION_URL'] as const) {
      if (raw.NODE_ENV === 'production' && !raw[chave]) {
        ctx.addIssue({ code: 'custom', path: [chave], message: `${chave} é obrigatória em produção.` });
      }
    }
    return {
      ...raw,
      DATABASE_URL: raw.DATABASE_URL ?? PADRAO_LOCAL.DATABASE_URL,
      DATABASE_MIGRATION_URL: raw.DATABASE_MIGRATION_URL ?? PADRAO_LOCAL.DATABASE_MIGRATION_URL,
    };
  });

export type Env = z.output<typeof envSchema>;

export const env: Env = envSchema.parse(process.env);
