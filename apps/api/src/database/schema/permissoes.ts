import { ACOES, type Acao, PERFIS_DE_VINCULO } from '@recreio/contracts';
import { sql } from 'drizzle-orm';
import { check, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { id, listaSql, timestamps } from './colunas.ts';
import { escolas } from './escolas.ts';

/** Ações que cada perfil tem em cada módulo, por escola. A escola muda a matriz em Grupos e permissões. */
export const permissoes = pgTable(
  'permissoes',
  {
    id: id(),
    escolaId: uuid('escola_id')
      .notNull()
      .references(() => escolas.id),
    perfil: text('perfil', { enum: PERFIS_DE_VINCULO }).notNull(),
    modulo: text('modulo').notNull(),
    acoes: text('acoes').array().$type<Acao[]>().notNull(),
    ...timestamps(),
  },
  (t) => [
    // Também serve de índice para escola_id e para a checagem por perfil e módulo.
    unique('permissoes_escola_perfil_modulo_unique').on(t.escolaId, t.perfil, t.modulo),
    check('permissoes_perfil_valido', sql`${t.perfil} in (${listaSql(PERFIS_DE_VINCULO)})`),
    check('permissoes_modulo_formato', sql`${t.modulo} ~ '^[a-z][a-z0-9-]*$'`),
    check('permissoes_acoes_validas', sql`${t.acoes} <@ array[${listaSql(ACOES)}]::text[]`),
    check('permissoes_acoes_nao_vazias', sql`cardinality(${t.acoes}) > 0`),
  ],
);
