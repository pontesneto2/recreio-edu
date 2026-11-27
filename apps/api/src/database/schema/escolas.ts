import { sql } from 'drizzle-orm';
import { check, pgTable, text } from 'drizzle-orm/pg-core';
import { id, timestamps } from './colunas.ts';

export const escolas = pgTable(
  'escolas',
  {
    id: id(),
    nome: text('nome').notNull(),
    cnpj: text('cnpj').notNull().unique(),
    cidade: text('cidade').notNull(),
    corMarca: text('cor_marca').notNull(),
    /** Host do portal da escola, sem porta e em minúsculas. A API resolve a escola por ele (ADR 0006). */
    dominio: text('dominio').notNull().unique(),
    ...timestamps(),
  },
  (t) => [
    check('escolas_cor_marca_hex', sql`${t.corMarca} ~ '^#[0-9A-Fa-f]{6}$'`),
    check('escolas_dominio_minusculo', sql`${t.dominio} = lower(${t.dominio})`),
  ],
);
