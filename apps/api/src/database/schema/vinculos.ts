import { PERFIS_DE_VINCULO } from '@recreio/contracts';
import { sql } from 'drizzle-orm';
import { check, index, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { user } from './autenticacao.ts';
import { id, listaSql, timestamps } from './colunas.ts';
import { escolas } from './escolas.ts';

/** Uma linha por perfil da pessoa na escola. Mãe e professora na mesma escola são 2 linhas. */
export const vinculos = pgTable(
  'vinculos',
  {
    id: id(),
    escolaId: uuid('escola_id')
      .notNull()
      .references(() => escolas.id),
    usuarioId: text('usuario_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    perfil: text('perfil', { enum: PERFIS_DE_VINCULO }).notNull(),
    ...timestamps(),
  },
  (t) => [
    // Também serve de índice para escola_id e para a busca dos perfis da pessoa na escola.
    unique('vinculos_escola_usuario_perfil_unique').on(t.escolaId, t.usuarioId, t.perfil),
    index('vinculos_usuario_idx').on(t.usuarioId),
    check('vinculos_perfil_valido', sql`${t.perfil} in (${listaSql(PERFIS_DE_VINCULO)})`),
  ],
);
