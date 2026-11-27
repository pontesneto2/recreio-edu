import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { slugDaRota } from './resolver-escola.ts';

describe('slugDaRota', () => {
  test('aceita minúsculas, números e hífen entre palavras', () => {
    for (const slug of ['colegio-recreio', 'escola2', 'a-b-c']) assert.equal(slugDaRota(slug), slug);
  });

  test('recusa maiúsculas, espaço, ponto, hífen nas pontas e texto longo', () => {
    for (const slug of ['Colegio', 'colegio recreio', '../etc', '-recreio', 'recreio-', 'a--b', 'x'.repeat(64), 42]) {
      assert.equal(slugDaRota(slug), undefined, String(slug));
    }
  });
});
