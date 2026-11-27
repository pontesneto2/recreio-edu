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

/** Id da escola do slug da rota, pela função `escola_por_slug` (SECURITY DEFINER). ADR 0011. */
export const buscarEscolaPorSlug = async (db: Database, slug: string): Promise<string | undefined> => {
  const { rows } = await db.execute<{ id: string | null }>(sql`select escola_por_slug(${slug}) as id`);
  return rows[0]?.id ?? undefined;
};

/**
 * Vínculos da conta em todas as escolas, pela função `vinculos_do_usuario` (SECURITY DEFINER).
 * `vinculos` tem RLS por escola; esta é a única leitura entre escolas, e devolve só slug, nome e perfil.
 */
export const buscarVinculosDoUsuario = async (db: Database, usuarioId: string) => {
  const { rows } = await db.execute<{ slug: string; nome: string; perfil: string }>(
    sql`select slug, nome, perfil from vinculos_do_usuario(${usuarioId})`,
  );
  return rows;
};
