import { sql } from 'drizzle-orm';
import { env } from '../../config/env.ts';
import { logger } from '../../shared/logger/logger.ts';
import { createConexaoBanco } from '../client.ts';
import { migrarBanco } from '../migrator.ts';
import { seedDadosCanonicos } from '../seed/seed.ts';

if (env.NODE_ENV === 'production') {
  throw new Error('db:reset apaga todos os dados e não roda em produção.');
}

// Recria o schema public com as mesmas permissões de infra/postgres/init/01-app-role.sh.
const conexao = createConexaoBanco(env.DATABASE_MIGRATION_URL);
try {
  await conexao.db.execute(
    sql.raw(`
      DROP SCHEMA IF EXISTS drizzle CASCADE;
      DROP SCHEMA IF EXISTS public CASCADE;
      CREATE SCHEMA public;
      GRANT USAGE ON SCHEMA public TO recreio_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO recreio_app;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT USAGE, SELECT ON SEQUENCES TO recreio_app;
    `),
  );
} finally {
  await conexao.encerrar();
}

await migrarBanco(env.DATABASE_MIGRATION_URL);
const escolaId = await seedDadosCanonicos(env.DATABASE_MIGRATION_URL, env.DEV_ESCOLA_DOMINIO);
logger.info({ escolaId }, 'banco recriado, migrado e com seed');
