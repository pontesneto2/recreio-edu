import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { origemConfiavel, origemDoLink } from './origens.ts';

const LISTA = ['http://localhost:5173', 'https://*.recreio.app'];
const PADRAO = 'https://portal.recreio.app';

const pedido = (origem?: string) =>
  new Request('http://api.local/api/auth/request-password-reset', {
    method: 'POST',
    headers: origem ? { Origin: origem } : {},
  });

describe('origemConfiavel', () => {
  test('aceita origem exata e subdomínio do curinga', () => {
    assert.equal(origemConfiavel('http://localhost:5173', LISTA), true);
    assert.equal(origemConfiavel('https://colegiorecreio.recreio.app', LISTA), true);
  });

  test('recusa o domínio sem subdomínio, outro protocolo, outra porta e sufixo parecido', () => {
    for (const origem of [
      'https://recreio.app',
      'http://colegiorecreio.recreio.app',
      'http://localhost:5174',
      'https://golpe.recreio.app.example',
      'https://a.b.recreio.app',
    ]) {
      assert.equal(origemConfiavel(origem, LISTA), false, origem);
    }
  });
});

describe('origemDoLink', () => {
  test('usa o Origin da requisição quando ele está na lista', () => {
    assert.equal(
      origemDoLink(pedido('https://colegiorecreio.recreio.app'), LISTA, PADRAO),
      'https://colegiorecreio.recreio.app',
    );
  });

  test('cai na origem padrão sem Origin ou com Origin fora da lista', () => {
    assert.equal(origemDoLink(pedido(), LISTA, PADRAO), PADRAO);
    assert.equal(origemDoLink(pedido('https://golpe.example'), LISTA, PADRAO), PADRAO);
    assert.equal(origemDoLink(undefined, LISTA, PADRAO), PADRAO);
  });
});
