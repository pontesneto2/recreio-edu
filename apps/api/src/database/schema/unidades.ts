import { pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { id } from './colunas.ts';
import { escolas } from './escolas.ts';

export const unidades = pgTable(
  'unidades',
  {
    id: id(),
    escolaId: uuid('escola_id')
      .notNull()
      .references(() => escolas.id),
    slug: text('slug').notNull(),
    nome: text('nome').notNull(),
  },
  (t) => [
    // Também serve de índice para escola_id.
    unique('unidades_escola_slug_unique').on(t.escolaId, t.slug),
    // Alvo das chaves compostas: turma e aluno só apontam para unidade da mesma escola.
    unique('unidades_escola_id_unique').on(t.escolaId, t.id),
  ],
);
