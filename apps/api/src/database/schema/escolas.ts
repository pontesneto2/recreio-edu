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
    /** Identificador da escola na rota do portal e da API (ADR 0011): `/colegio-recreio/...`. */
    slug: text('slug').notNull().unique(),
    /** Domínio próprio da escola, sem porta e em minúsculas. Reservado para uma opção futura; a API não resolve por ele. */
    dominio: text('dominio').unique(),
    ...timestamps(),
  },
  (t) => [
    check('escolas_cor_marca_hex', sql`${t.corMarca} ~ '^#[0-9A-Fa-f]{6}$'`),
    check('escolas_dominio_minusculo', sql`${t.dominio} = lower(${t.dominio})`),
    check('escolas_slug_formato', sql`${t.slug} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(${t.slug}) <= 63`),
  ],
);
