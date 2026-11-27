import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { fileURLToPath } from 'node:url';
import { createConexaoBanco } from './client.ts';

/** Pasta das migrações geradas pelo drizzle-kit (apps/api/drizzle). Vale para src/ e dist/. */
export const PASTA_MIGRACOES = fileURLToPath(new URL('../../drizzle', import.meta.url));

/** Aplica as migrações pendentes. Use a conexão do dono das tabelas (DATABASE_MIGRATION_URL). */
export const migrarBanco = async (urlDono: string) => {
  const conexao = createConexaoBanco(urlDono);
  try {
    await migrate(conexao.db, { migrationsFolder: PASTA_MIGRACOES });
  } finally {
    await conexao.encerrar();
  }
};
