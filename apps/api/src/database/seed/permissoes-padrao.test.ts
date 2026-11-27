import { ACOES, MODULOS, PERFIS_DE_VINCULO } from '@recreio/contracts';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { PERMISSOES_PADRAO, linhasDePermissao } from './permissoes-padrao.ts';

const pode = (perfil: keyof typeof PERMISSOES_PADRAO, modulo: string, acao: string) =>
  linhasDePermissao().some(
    (linha) => linha.perfil === perfil && linha.modulo === modulo && linha.acoes.includes(acao as never),
  );

describe('matriz padrão de permissões', () => {
  test('todo perfil tem linha, e só com módulos e ações conhecidos', () => {
    for (const perfil of PERFIS_DE_VINCULO) assert.ok(Object.keys(PERMISSOES_PADRAO[perfil]).length > 0, perfil);
    for (const linha of linhasDePermissao()) {
      assert.ok((MODULOS as readonly string[]).includes(linha.modulo), linha.modulo);
      assert.ok(linha.acoes.length > 0, `${linha.perfil}.${linha.modulo} sem ação`);
      for (const acao of linha.acoes) assert.ok((ACOES as readonly string[]).includes(acao), acao);
    }
  });

  test('direção tem todas as ações em todos os módulos', () => {
    for (const modulo of MODULOS)
      for (const acao of ACOES) assert.ok(pode('direcao', modulo, acao), `${modulo}:${acao}`);
  });

  test('portaria, responsável, aluno e professor não veem a lista de alunos', () => {
    for (const perfil of ['portaria', 'responsavel', 'aluno', 'professor'] as const) {
      assert.equal(pode(perfil, 'alunos', 'ver'), false, perfil);
    }
  });

  test('secretaria, financeiro e coordenação veem alunos; só a secretaria edita', () => {
    for (const perfil of ['secretaria', 'financeiro', 'coordenacao'] as const) assert.ok(pode(perfil, 'alunos', 'ver'));
    assert.ok(pode('secretaria', 'alunos', 'editar'));
    assert.equal(pode('financeiro', 'alunos', 'editar'), false);
  });
});
