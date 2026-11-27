import { boolean, index, pgTable, text, timestamp, unique } from 'drizzle-orm/pg-core';

/*
 * Tabelas do Better Auth (ADR 0007), geradas com `npx auth generate` e ajustadas ao projeto:
 * instantes com fuso e uma chave única por conta de provedor. São globais, sem escola_id:
 * a mesma pessoa entra em qualquer escola com a mesma conta. O acesso à escola vem de `vinculos`.
 * Os nomes de tabela e de campo seguem o Better Auth, que lê e grava nelas fora de `withEscola`.
 */

const instante = (nome: string) => timestamp(nome, { withTimezone: true });

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: instante('created_at').defaultNow().notNull(),
  updatedAt: instante('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: instante('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: instante('created_at').defaultNow().notNull(),
    updatedAt: instante('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (t) => [index('session_user_id_idx').on(t.userId)],
);

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: instante('access_token_expires_at'),
    refreshTokenExpiresAt: instante('refresh_token_expires_at'),
    scope: text('scope'),
    /** Hash scrypt da senha, no formato do Better Auth. Só na conta `credential`. */
    password: text('password'),
    createdAt: instante('created_at').defaultNow().notNull(),
    updatedAt: instante('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [
    index('account_user_id_idx').on(t.userId),
    unique('account_provider_account_unique').on(t.providerId, t.accountId),
  ],
);

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: instante('expires_at').notNull(),
    createdAt: instante('created_at').defaultNow().notNull(),
    updatedAt: instante('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (t) => [index('verification_identifier_idx').on(t.identifier)],
);
