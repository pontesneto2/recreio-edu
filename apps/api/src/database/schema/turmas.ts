import { sql } from 'drizzle-orm';
import { check, foreignKey, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { id } from './colunas.ts';
import { escolas } from './escolas.ts';
import { unidades } from './unidades.ts';

export const TURNOS = ['manha', 'tarde', 'integral', 'noite'] as const;
export type Turno = (typeof TURNOS)[number];

export const turmas = pgTable(
  'turmas',
  {
    id: id(),
    escolaId: uuid('escola_id')
      .notNull()
      .references(() => escolas.id),
    unidadeId: uuid('unidade_id').notNull(),
    nome: text('nome').notNull(),
    turno: text('turno', { enum: TURNOS }).notNull(),
    anoLetivo: integer('ano_letivo').notNull(),
  },
  (t) => [
    foreignKey({
      name: 'turmas_unidade_fk',
      columns: [t.escolaId, t.unidadeId],
      foreignColumns: [unidades.escolaId, unidades.id],
    }),
    // Também serve de índice para escola_id e para a chave composta da unidade.
    unique('turmas_escola_unidade_id_unique').on(t.escolaId, t.unidadeId, t.id),
    unique('turmas_unidade_ano_nome_unique').on(t.unidadeId, t.anoLetivo, t.nome),
    check('turmas_turno_valido', sql`${t.turno} in ('manha', 'tarde', 'integral', 'noite')`),
    check('turmas_ano_letivo_valido', sql`${t.anoLetivo} between 2000 and 2100`),
  ],
);
