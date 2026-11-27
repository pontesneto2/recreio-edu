import type { Aluno } from '@recreio/contracts';
import type { AlunosRepository } from './alunos.repository.ts';

export type AlunoDaEscola = Aluno & { escolaId: string };

/** Repositório em memória para testes de service. Separa os alunos por escola, como o RLS faz no banco. */
export const createInMemoryAlunosRepository = (seed: readonly AlunoDaEscola[]): AlunosRepository => {
  const daEscola = (escolaId: string): Aluno[] =>
    seed.filter((aluno) => aluno.escolaId === escolaId).map(({ escolaId: _escolaId, ...aluno }) => aluno);

  return {
    list: async ({ escolaId }) => daEscola(escolaId),
    findById: async ({ escolaId }, id) => daEscola(escolaId).find((aluno) => aluno.id === id),
  };
};
