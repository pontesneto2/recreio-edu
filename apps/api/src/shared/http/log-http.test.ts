import assert from 'node:assert/strict';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { describe, test } from 'node:test';
import { camposDoLog, ignorarNoLog } from './log-http.ts';

const req = (url: string) => ({ url }) as IncomingMessage;

describe('log HTTP', () => {
  test('health e ready ficam fora do log, com ou sem query', () => {
    for (const url of ['/api/health', '/api/ready', '/api/ready?x=1']) assert.equal(ignorarNoLog(req(url)), true, url);
    for (const url of ['/api/v1/escola', '/api/healthz', '/api/docs']) assert.equal(ignorarNoLog(req(url)), false, url);
  });

  test('a linha final leva a escola quando ela foi resolvida', () => {
    const comEscola = { locals: { escola: { escolaId: 'e1' } } } as unknown as ServerResponse;
    assert.deepEqual(camposDoLog(req('/'), comEscola), { escolaId: 'e1' });
    assert.deepEqual(camposDoLog(req('/'), { locals: {} } as unknown as ServerResponse), {});
  });
});
