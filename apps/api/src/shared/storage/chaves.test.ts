import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { NotFoundError, ValidationError } from '../errors/app-error.ts';
import { chaveDoArquivo, conferirChaveDaEscola } from './chaves.ts';

const ESCOLA_A = '0f4f6a1e-1111-4000-8000-000000000001';
const ESCOLA_B = '0f4f6a1e-2222-4000-8000-000000000002';

describe('chaves de arquivo', () => {
  test('começam pelo id da escola', () => {
    assert.equal(chaveDoArquivo(ESCOLA_A, 'alunos/davi/rg.pdf'), `${ESCOLA_A}/alunos/davi/rg.pdf`);
  });

  test('recusam caminho que sobe de pasta, começa com barra ou tem caractere fora da regra', () => {
    for (const caminho of ['../outra/rg.pdf', 'a/../../b', '/rg.pdf', 'a//b', 'foto com espaço.jpg', '', 'a/.']) {
      assert.throws(() => chaveDoArquivo(ESCOLA_A, caminho), ValidationError, caminho);
    }
  });

  test('recusam escolaId que não é UUID', () => {
    assert.throws(() => chaveDoArquivo('escola-a', 'rg.pdf'), /escolaId inválido/);
  });

  test('chave de outra escola responde 404', () => {
    const chave = chaveDoArquivo(ESCOLA_B, 'rg.pdf');
    assert.throws(() => conferirChaveDaEscola(ESCOLA_A, chave), NotFoundError);
    assert.doesNotThrow(() => conferirChaveDaEscola(ESCOLA_B, chave));
  });
});
