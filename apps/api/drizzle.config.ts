import { defineConfig } from 'drizzle-kit';

// Migrações rodam como o dono das tabelas (recreio), nunca como recreio_app.
export default defineConfig({
  dialect: 'postgresql',
  schema: './src/database/schema/index.ts',
  out: './drizzle',
  casing: 'snake_case',
  dbCredentials: {
    url: process.env.DATABASE_MIGRATION_URL ?? 'postgres://recreio:recreio@localhost:5432/recreio',
  },
});
