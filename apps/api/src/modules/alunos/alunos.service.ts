import type { Aluno } from '@recreio/contracts';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import type { AlunosRepository } from './alunos.repository.ts';

export type AlunosService = {
  listar: () => Promise<Aluno[]>;
  buscarPorId: (id: string) => Promise<Aluno>;
};

export const createAlunosService = (repository: AlunosRepository): AlunosService => ({
  listar: () => repository.list(),
  buscarPorId: async (id) => {
    const aluno = await repository.findById(id);
    if (!aluno) throw new NotFoundError('Aluno não encontrado.');
    return aluno;
  },
});
