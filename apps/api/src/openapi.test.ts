import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
import { OPENAPI_SNAPSHOT_URL, openApiDocument } from './openapi.ts';
import { serializeOpenApi } from './shared/openapi/document.ts';

test('docs/api/openapi.json está igual ao documento gerado dos contratos', async () => {
  const committed = await readFile(OPENAPI_SNAPSHOT_URL, 'utf8').catch(() => '');
  const generated = serializeOpenApi(openApiDocument);

  assert.ok(
    committed.replaceAll('\r\n', '\n') === generated,
    'O OpenAPI gerado mudou. Rode `npm run openapi -w @recreio/api` e versione docs/api/openapi.json.',
  );
});

test('toda operação tem operationId único, summary e tag', () => {
  const ids = new Set<string>();
  for (const [path, item] of Object.entries(openApiDocument.paths ?? {})) {
    for (const method of ['get', 'post', 'put', 'patch', 'delete'] as const) {
      const operation = item[method];
      if (!operation) continue;
      const where = `${method.toUpperCase()} ${path}`;
      assert.ok(operation.operationId, `${where} sem operationId`);
      assert.ok(!ids.has(operation.operationId), `${where} repete o operationId ${operation.operationId}`);
      ids.add(operation.operationId);
      assert.ok(operation.summary, `${where} sem summary`);
      assert.ok(operation.tags?.length, `${where} sem tag`);
    }
  }
  assert.ok(ids.size > 0);
});
