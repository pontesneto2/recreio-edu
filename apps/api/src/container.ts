import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { env } from './config/env.ts';
import { createConexaoBanco } from './database/client.ts';
import { buscarEscolaPorDominio, createWithEscola } from './database/escola-context.ts';
import { createDrizzleAlunosRepository } from './modules/alunos/alunos.repository.ts';
import { type AlunosService, createAlunosService } from './modules/alunos/alunos.service.ts';
import { createDrizzleEscolaRepository } from './modules/escola/escola.repository.ts';
import { type EscolaService, createEscolaService } from './modules/escola/escola.service.ts';
import { createEnfileirador, type Enfileirador } from './shared/queue/enfileirador.ts';
import { createRedis, encerrarRedis, pingRedis } from './shared/redis/redis.ts';
import { type Armazenamento, type ArmazenamentoConfig, createArmazenamento } from './shared/storage/armazenamento.ts';
import { createResolverEscola } from './shared/tenant/resolver-escola.ts';

export type ContainerConfig = {
  /** Conexão como recreio_app. */
  databaseUrl: string;
  /** Domínio atendido em localhost. Vazio em produção. */
  dominioLocal?: string;
  /** Sem Redis, o limite de requisições conta em memória e `filas.enfileirar` rejeita. */
  redisUrl?: string;
  armazenamento?: ArmazenamentoConfig;
};

/** Raiz de composição: liga cada repositório ao seu service. Os testes podem montar outro container. */
export type Container = {
  escolaService: EscolaService;
  alunosService: AlunosService;
  /** Middleware que resolve a escola pelo Host. Vai antes de toda rota com dados de escola. */
  resolverEscola: RequestHandler;
  verificarBanco: () => Promise<void>;
  /** Infraestrutura: Redis do limite e das filas, produtor das filas e arquivos (ADRs 0009 e 0010). */
  redis?: Redis;
  verificarRedis?: () => Promise<void>;
  filas: Enfileirador;
  armazenamento?: Armazenamento;
  encerrar: () => Promise<void>;
};

const armazenamentoDoEnv = (): ArmazenamentoConfig => ({
  endpoint: env.S3_ENDPOINT,
  endpointPublico: env.S3_PUBLIC_ENDPOINT,
  regiao: env.S3_REGION,
  credenciais:
    env.S3_ACCESS_KEY && env.S3_SECRET_KEY
      ? { accessKeyId: env.S3_ACCESS_KEY, secretAccessKey: env.S3_SECRET_KEY }
      : undefined,
  bucket: env.S3_BUCKET,
  forcePathStyle: env.S3_FORCE_PATH_STYLE,
  validadeSegundos: env.S3_URL_TTL_SECONDS,
});

const configPadrao = (): ContainerConfig => ({
  databaseUrl: env.DATABASE_URL,
  dominioLocal: env.NODE_ENV === 'production' ? undefined : env.DEV_ESCOLA_DOMINIO,
  redisUrl: env.REDIS_URL,
  armazenamento: armazenamentoDoEnv(),
});

export const createContainer = (config: ContainerConfig = configPadrao()): Container => {
  const banco = createConexaoBanco(config.databaseUrl);
  const withEscola = createWithEscola(banco.db);
  const redis = config.redisUrl ? createRedis(config.redisUrl, 'api') : undefined;
  const filas = createEnfileirador(redis);
  const armazenamento = config.armazenamento ? createArmazenamento(config.armazenamento) : undefined;

  return {
    escolaService: createEscolaService(createDrizzleEscolaRepository(withEscola)),
    alunosService: createAlunosService(createDrizzleAlunosRepository(withEscola)),
    resolverEscola: createResolverEscola({
      buscarEscolaPorDominio: (dominio) => buscarEscolaPorDominio(banco.db, dominio),
      dominioLocal: config.dominioLocal,
    }),
    verificarBanco: banco.verificar,
    redis,
    verificarRedis: redis ? () => pingRedis(redis) : undefined,
    filas,
    armazenamento,
    encerrar: async () => {
      await filas.encerrar();
      armazenamento?.encerrar();
      await Promise.all([banco.encerrar(), redis ? encerrarRedis(redis) : undefined]);
    },
  };
};
