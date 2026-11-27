import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { ZodError } from 'zod';
import { parseEnv, parseTrustProxy } from './env.ts';

const PRODUCAO = {
  NODE_ENV: 'production',
  DATABASE_URL: 'postgres://app:x@db:5432/recreio',
  DATABASE_MIGRATION_URL: 'postgres://dono:x@db:5432/recreio',
  REDIS_URL: 'redis://redis:6379',
  SMTP_URL: 'smtps://usuario:senha@smtp.exemplo.com:465',
  S3_BUCKET: 'recreio-producao',
  AUTH_SECRET: 'segredo-de-producao-com-mais-de-32-caracteres',
};

/** Caminhos das variáveis que o Zod recusou. */
const recusadas = (variaveis: NodeJS.ProcessEnv) => {
  try {
    parseEnv(variaveis);
    return [];
  } catch (err) {
    assert.ok(err instanceof ZodError);
    return err.issues.map((issue) => issue.path.join('.'));
  }
};

describe('parseTrustProxy', () => {
  test('converte booleano e número de saltos e mantém nomes e listas', () => {
    assert.equal(parseTrustProxy('true'), true);
    assert.equal(parseTrustProxy('false'), false);
    assert.equal(parseTrustProxy('2'), 2);
    assert.equal(parseTrustProxy(' loopback '), 'loopback');
    assert.equal(parseTrustProxy('loopback, 10.0.0.0/8'), 'loopback, 10.0.0.0/8');
  });
});

describe('variáveis de infraestrutura', () => {
  test('em desenvolvimento valem os serviços do docker-compose.yml', () => {
    const env = parseEnv({ NODE_ENV: 'development' });
    assert.equal(env.TRUST_PROXY, 'loopback');
    assert.equal(env.REDIS_URL, 'redis://localhost:6379');
    assert.equal(env.SMTP_URL, 'smtp://localhost:1025');
    assert.equal(env.S3_ENDPOINT, 'http://localhost:9000');
    assert.equal(env.S3_BUCKET, 'recreio');
    assert.equal(env.S3_FORCE_PATH_STYLE, true);
    assert.equal(env.S3_URL_TTL_SECONDS, 300);
    assert.equal(env.OTEL_SDK_DISABLED, false);
    assert.equal(env.SENTRY_DSN, undefined);
    assert.equal(env.SENTRY_ENVIRONMENT, 'development');
  });

  test('nos testes não há Redis padrão, e o limite conta em memória', () => {
    assert.equal(parseEnv({ NODE_ENV: 'test' }).REDIS_URL, undefined);
  });

  test('produção exige banco, segredo da sessão, Redis, SMTP e bucket', () => {
    const faltando = recusadas({ NODE_ENV: 'production' });
    for (const chave of [
      'DATABASE_URL',
      'DATABASE_MIGRATION_URL',
      'AUTH_SECRET',
      'REDIS_URL',
      'SMTP_URL',
      'S3_BUCKET',
    ]) {
      assert.ok(faltando.includes(chave), `${chave} deveria ser obrigatória`);
    }
  });

  test('produção não herda endpoint nem chaves locais do S3', () => {
    const env = parseEnv(PRODUCAO);
    assert.equal(env.S3_ENDPOINT, undefined);
    assert.equal(env.S3_ACCESS_KEY, undefined);
    assert.equal(env.S3_FORCE_PATH_STYLE, false);
    assert.equal(env.SENTRY_ENVIRONMENT, 'production');
  });

  test('aceita TRUST_PROXY numérico e OTEL_SDK_DISABLED como texto', () => {
    const env = parseEnv({ ...PRODUCAO, TRUST_PROXY: '1', OTEL_SDK_DISABLED: 'true' });
    assert.equal(env.TRUST_PROXY, 1);
    assert.equal(env.OTEL_SDK_DISABLED, true);
  });

  test('recusa SENTRY_DSN e validade de URL fora da regra', () => {
    const erros = recusadas({ ...PRODUCAO, SENTRY_DSN: 'nao-e-url', S3_URL_TTL_SECONDS: '7200' });
    assert.deepEqual(erros.sort(), ['S3_URL_TTL_SECONDS', 'SENTRY_DSN']);
  });
});
