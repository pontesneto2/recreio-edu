import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import { createInMemoryAlunosRepository } from './alunos.repository.memory.ts';
import { createAlunosService } from './alunos.service.ts';

const RECREIO = { escolaId: '6f1c1c1e-0000-4000-8000-000000000001' };
const OUTRA = { escolaId: '6f1c1c1e-0000-4000-8000-000000000002' };
const DAVI_ID = '0d4b7a52-0000-4000-8000-000000000318';

const davi = {
  escolaId: RECREIO.escolaId,
  id: DAVI_ID,
  nome: 'Davi Lima',
  turma: '2º ano B',
  turno: 'Manhã',
  matricula: '2024-0318',
  mensalidadeCentavos: 148000,
};

describe('AlunosService', () => {
  const service = createAlunosService(createInMemoryAlunosRepository([davi]));

  test('busca um aluno pelo id', async () => {
    const aluno = await service.buscarPorId(RECREIO, DAVI_ID);
    assert.equal(aluno.nome, 'Davi Lima');
  });

  test('lista só os alunos da escola do contexto', async () => {
    assert.equal((await service.listar(RECREIO)).length, 1);
    assert.deepEqual(await service.listar(OUTRA), []);
  });

  test('lança NotFoundError para id desconhecido', async () => {
    await assert.rejects(service.buscarPorId(RECREIO, '0d4b7a52-0000-4000-8000-000000000999'), NotFoundError);
  });

  test('lança NotFoundError para aluno de outra escola', async () => {
    await assert.rejects(service.buscarPorId(OUTRA, DAVI_ID), NotFoundError);
  });
});
