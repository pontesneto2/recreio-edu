import type { RequestHandler } from 'express';
import type { Redis } from 'ioredis';
import { env } from './config/env.ts';
import { createConexaoBanco } from './database/client.ts';
import { buscarEscolaPorSlug, createWithEscola } from './database/escola-context.ts';
import { createDrizzleAlunosRepository } from './modules/alunos/alunos.repository.ts';
import { type AlunosService, createAlunosService } from './modules/alunos/alunos.service.ts';
import type { ConfigAutenticacao } from './modules/autenticacao/auth.ts';
import { type Autenticacao, createAutenticacao } from './modules/autenticacao/autenticacao.ts';
import { createDrizzleEscolaRepository } from './modules/escola/escola.repository.ts';
import { type EscolaService, createEscolaService } from './modules/escola/escola.service.ts';
import { createEnfileirador, type Enfileirador } from './shared/queue/enfileirador.ts';
import { createRedis, encerrarRedis, pingRedis } from './shared/redis/redis.ts';
import { type Armazenamento, type ArmazenamentoConfig, createArmazenamento } from './shared/storage/armazenamento.ts';
import { createResolverEscola } from './shared/tenant/resolver-escola.ts';

export type ContainerConfig = {
  /** Conexão como recreio_app. */
  databaseUrl: string;
  /** Sem Redis, o limite de requisições conta em memória e `filas.enfileirar` rejeita. */
  redisUrl?: string;
  armazenamento?: ArmazenamentoConfig;
  /** Better Auth (ADR 0007). Os testes trocam origens e segredo. */
  autenticacao?: Partial<ConfigAutenticacao>;
  /** Produtor das filas. Padrão: BullMQ no Redis de `redisUrl`. Os testes guardam as tarefas em memória. */
  filas?: Enfileirador;
};

/** Raiz de composição: liga cada repositório ao seu service. Os testes podem montar outro container. */
export type Container = {
  escolaService: EscolaService;
  alunosService: AlunosService;
  /** Middleware que resolve a escola pelo slug de `/escolas/:escola`. Vai antes de toda rota com dados de escola. */
  resolverEscola: RequestHandler;
  /** Rotas do Better Auth e middlewares de sessão e permissão. */
  autenticacao: Autenticacao;
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
  redisUrl: env.REDIS_URL,
  armazenamento: armazenamentoDoEnv(),
});

const autenticacaoPadrao = (): ConfigAutenticacao => ({
  segredo: env.AUTH_SECRET,
  url: env.AUTH_URL,
  origensConfiaveis: env.AUTH_TRUSTED_ORIGINS,
  cookieSeguro: env.NODE_ENV === 'production',
  cadastroAberto: env.NODE_ENV !== 'production',
});

export const createContainer = (config: ContainerConfig = configPadrao()): Container => {
  const banco = createConexaoBanco(config.databaseUrl);
  const withEscola = createWithEscola(banco.db);
  const redis = config.redisUrl ? createRedis(config.redisUrl, 'api') : undefined;
  const filas = config.filas ?? createEnfileirador(redis);
  const armazenamento = config.armazenamento ? createArmazenamento(config.armazenamento) : undefined;

  return {
    escolaService: createEscolaService(createDrizzleEscolaRepository(withEscola)),
    alunosService: createAlunosService(createDrizzleAlunosRepository(withEscola)),
    resolverEscola: createResolverEscola({ buscarEscolaPorSlug: (slug) => buscarEscolaPorSlug(banco.db, slug) }),
    autenticacao: createAutenticacao(banco.db, withEscola, filas, { ...autenticacaoPadrao(), ...config.autenticacao }),
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
