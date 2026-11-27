import { sql } from 'drizzle-orm';
import { type NodePgDatabase, drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import { logger } from '../shared/logger/logger.ts';
import * as schema from './schema/index.ts';

export type Database = NodePgDatabase<typeof schema>;
export type Transacao = Parameters<Parameters<Database['transaction']>[0]>[0];

export type ConexaoBanco = {
  db: Database;
  /** Roda `select 1`. Rejeita quando o banco não responde. */
  verificar: () => Promise<void>;
  encerrar: () => Promise<void>;
};

export const createConexaoBanco = (connectionString: string): ConexaoBanco => {
  const pool = new pg.Pool({ connectionString, connectionTimeoutMillis: 5_000 });
  // Sem este listener, a queda de uma conexão ociosa derruba o processo.
  pool.on('error', (err) => logger.error({ err }, 'conexão ociosa com o banco caiu'));

  const db = drizzle({ client: pool, schema, casing: 'snake_case' });

  return {
    db,
    verificar: async () => {
      await db.execute(sql`select 1`);
    },
    encerrar: () => pool.end(),
  };
};
