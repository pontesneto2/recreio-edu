import { sql } from 'drizzle-orm';
import { check, foreignKey, index, integer, pgTable, text, unique, uuid } from 'drizzle-orm/pg-core';
import { id, timestamps } from './colunas.ts';
import { escolas } from './escolas.ts';
import { turmas } from './turmas.ts';
import { unidades } from './unidades.ts';

export const alunos = pgTable(
  'alunos',
  {
    id: id(),
    escolaId: uuid('escola_id')
      .notNull()
      .references(() => escolas.id),
    unidadeId: uuid('unidade_id').notNull(),
    turmaId: uuid('turma_id').notNull(),
    nome: text('nome').notNull(),
    matricula: text('matricula').notNull(),
    mensalidadeCentavos: integer('mensalidade_centavos').notNull(),
    ...timestamps(),
  },
  (t) => [
    foreignKey({
      name: 'alunos_unidade_fk',
      columns: [t.escolaId, t.unidadeId],
      foreignColumns: [unidades.escolaId, unidades.id],
    }),
    // A turma precisa ser da mesma escola e da mesma unidade do aluno.
    foreignKey({
      name: 'alunos_turma_fk',
      columns: [t.escolaId, t.unidadeId, t.turmaId],
      foreignColumns: [turmas.escolaId, turmas.unidadeId, turmas.id],
    }),
    unique('alunos_escola_matricula_unique').on(t.escolaId, t.matricula),
    // Cobre as 2 chaves compostas (prefixo escola_id, unidade_id).
    index('alunos_escola_unidade_turma_idx').on(t.escolaId, t.unidadeId, t.turmaId),
    check('alunos_mensalidade_nao_negativa', sql`${t.mensalidadeCentavos} >= 0`),
  ],
);
