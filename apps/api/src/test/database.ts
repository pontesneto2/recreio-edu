import { PostgreSqlContainer } from '@testcontainers/postgresql';
import { readFile } from 'node:fs/promises';
import { migrarBanco } from '../database/migrator.ts';

export type BancoDeTeste = {
  /** Conexão como recreio, dono das tabelas. */
  urlDono: string;
  /** Conexão como recreio_app, sujeita ao RLS. */
  urlApp: string;
  parar: () => Promise<void>;
};

const SCRIPT_INIT = new URL('../../../../infra/postgres/init/01-app-role.sh', import.meta.url);

/**
 * Sobe um PostgreSQL 17 descartável com o mesmo init do docker-compose.yml
 * (cria recreio_app) e aplica as migrações.
 */
export const iniciarBancoDeTeste = async (): Promise<BancoDeTeste> => {
  // O checkout no Windows pode trazer CRLF, que o sh do container não aceita.
  const script = (await readFile(SCRIPT_INIT, 'utf8')).replaceAll('\r\n', '\n');
  const container = await new PostgreSqlContainer('postgres:17-alpine')
    .withDatabase('recreio')
    .withUsername('recreio')
    .withPassword('recreio')
    .withEnvironment({ APP_DB_PASSWORD: 'recreio_app' })
    .withCopyContentToContainer([{ content: script, target: '/docker-entrypoint-initdb.d/01-app-role.sh' }])
    .start();

  const urlDono = container.getConnectionUri();
  const urlApp = `postgres://recreio_app:recreio_app@${container.getHost()}:${container.getPort()}/recreio`;
  await migrarBanco(urlDono);

  return {
    urlDono,
    urlApp,
    parar: async () => {
      await container.stop();
    },
  };
};
