import type { RequestHandler } from 'express';
import { env } from './config/env.ts';
import { createConexaoBanco } from './database/client.ts';
import { buscarEscolaPorDominio, createWithEscola } from './database/escola-context.ts';
import { createDrizzleAlunosRepository } from './modules/alunos/alunos.repository.ts';
import { type AlunosService, createAlunosService } from './modules/alunos/alunos.service.ts';
import { createDrizzleEscolaRepository } from './modules/escola/escola.repository.ts';
import { type EscolaService, createEscolaService } from './modules/escola/escola.service.ts';
import { createResolverEscola } from './shared/tenant/resolver-escola.ts';

export type ContainerConfig = {
  /** Conexão como recreio_app. */
  databaseUrl: string;
  /** Domínio atendido em localhost. Vazio em produção. */
  dominioLocal?: string;
};

/** Raiz de composição: liga cada repositório ao seu service. Os testes podem montar outro container. */
export type Container = {
  escolaService: EscolaService;
  alunosService: AlunosService;
  /** Middleware que resolve a escola pelo Host. Vai antes de toda rota com dados de escola. */
  resolverEscola: RequestHandler;
  verificarBanco: () => Promise<void>;
  encerrar: () => Promise<void>;
};

const configPadrao = (): ContainerConfig => ({
  databaseUrl: env.DATABASE_URL,
  dominioLocal: env.NODE_ENV === 'production' ? undefined : env.DEV_ESCOLA_DOMINIO,
});

export const createContainer = (config: ContainerConfig = configPadrao()): Container => {
  const banco = createConexaoBanco(config.databaseUrl);
  const withEscola = createWithEscola(banco.db);

  return {
    escolaService: createEscolaService(createDrizzleEscolaRepository(withEscola)),
    alunosService: createAlunosService(createDrizzleAlunosRepository(withEscola)),
    resolverEscola: createResolverEscola({
      buscarEscolaPorDominio: (dominio) => buscarEscolaPorDominio(banco.db, dominio),
      dominioLocal: config.dominioLocal,
    }),
    verificarBanco: banco.verificar,
    encerrar: banco.encerrar,
  };
};
