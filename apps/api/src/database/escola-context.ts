import { sql } from 'drizzle-orm';
import type { Database, Transacao } from './client.ts';

/**
 * Roda `fn` numa transação com `app.escola_id` definido. As políticas de RLS
 * liberam só as linhas dessa escola. Toda consulta de repositório passa por aqui.
 */
export type WithEscola = <T>(escolaId: string, fn: (tx: Transacao) => Promise<T>) => Promise<T>;

export const createWithEscola =
  (db: Database): WithEscola =>
  (escolaId, fn) =>
    db.transaction(async (tx) => {
      await tx.execute(sql`select set_config('app.escola_id', ${escolaId}, true)`);
      return fn(tx);
    });

/** Id da escola dona do domínio, pela função `escola_por_dominio` (SECURITY DEFINER). */
export const buscarEscolaPorDominio = async (db: Database, dominio: string): Promise<string | undefined> => {
  const { rows } = await db.execute<{ id: string | null }>(sql`select escola_por_dominio(${dominio}) as id`);
  return rows[0]?.id ?? undefined;
};
