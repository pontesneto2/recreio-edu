import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { dominioDoHost } from './resolver-escola.ts';

describe('dominioDoHost', () => {
  test('localhost e 127.0.0.1 viram o domínio local', () => {
    for (const host of ['localhost', '127.0.0.1', '[::1]', 'LOCALHOST']) {
      assert.equal(dominioDoHost(host, 'colegiorecreio.localhost'), 'colegiorecreio.localhost', host);
    }
  });

  test('sem domínio local, localhost segue como está', () => {
    assert.equal(dominioDoHost('localhost'), 'localhost');
  });

  test('outros hosts saem em minúsculas e sem ponto final', () => {
    assert.equal(dominioDoHost('ColegioRecreio.Recreio.App.', 'x'), 'colegiorecreio.recreio.app');
  });
});
