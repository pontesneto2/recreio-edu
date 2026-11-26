import { alunoSchema, escolaSchema } from '@recreio/contracts';
import assert from 'node:assert/strict';
import type { AddressInfo } from 'node:net';
import { after, before, describe, test } from 'node:test';
import { createApp } from './app.ts';
import { createContainer } from './container.ts';

describe('API HTTP', () => {
  const server = createApp(createContainer()).listen(0);
  let baseUrl = '';

  before(() => {
    baseUrl = `http://localhost:${(server.address() as AddressInfo).port}`;
  });
  after(() => {
    server.close();
  });

  test('GET /api/health responde ok', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'ok');
  });

  test('GET /api/escola segue o contrato', async () => {
    const res = await fetch(`${baseUrl}/api/escola`);
    assert.equal(res.status, 200);
    escolaSchema.parse(await res.json());
  });

  test('GET /api/alunos segue o contrato', async () => {
    const res = await fetch(`${baseUrl}/api/alunos`);
    alunoSchema
      .array()
      .min(1)
      .parse(await res.json());
  });

  test('GET /api/alunos/:id devolve 404 com código NAO_ENCONTRADO', async () => {
    const res = await fetch(`${baseUrl}/api/alunos/nao-existe`);
    assert.equal(res.status, 404);
    assert.equal((await res.json()).erro.codigo, 'NAO_ENCONTRADO');
  });

  test('GET /api/alunos/:id devolve 400 para id inválido', async () => {
    const res = await fetch(`${baseUrl}/api/alunos/${encodeURIComponent('ID Inválido')}`);
    assert.equal(res.status, 400);
    assert.equal((await res.json()).erro.codigo, 'DADOS_INVALIDOS');
  });

  test('rota desconhecida devolve 404', async () => {
    const res = await fetch(`${baseUrl}/api/nada`);
    assert.equal(res.status, 404);
  });
});
