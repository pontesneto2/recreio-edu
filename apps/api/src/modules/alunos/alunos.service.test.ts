import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { alunosSeed } from '../../database/seed/escola.seed.ts';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import { createInMemoryAlunosRepository } from './alunos.repository.ts';
import { createAlunosService } from './alunos.service.ts';

describe('AlunosService', () => {
  const service = createAlunosService(createInMemoryAlunosRepository(alunosSeed));

  test('busca um aluno pelo id', async () => {
    const aluno = await service.buscarPorId('davi');
    assert.equal(aluno.nome, 'Davi Lima');
  });

  test('lança NotFoundError para id desconhecido', async () => {
    await assert.rejects(service.buscarPorId('nao-existe'), NotFoundError);
  });
});
