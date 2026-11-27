import { sql } from 'drizzle-orm';
import { timestamp, uuid } from 'drizzle-orm/pg-core';

export const id = () => uuid('id').primaryKey().defaultRandom();

export const timestamps = () => ({
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  atualizadoEm: timestamp('atualizado_em', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});

/** Lista de literais para `check (coluna in (...))`. Os valores vêm de constantes do código, nunca do usuário. */
export const listaSql = (valores: readonly string[]) => sql.raw(valores.map((valor) => `'${valor}'`).join(', '));
