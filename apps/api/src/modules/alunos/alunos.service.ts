import type { Aluno } from '@recreio/contracts';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import type { EscolaContexto } from '../../shared/tenant/escola-contexto.ts';
import type { AlunosRepository } from './alunos.repository.ts';

export type AlunosService = {
  listar: (contexto: EscolaContexto) => Promise<Aluno[]>;
  buscarPorId: (contexto: EscolaContexto, id: string) => Promise<Aluno>;
};

export const createAlunosService = (repository: AlunosRepository): AlunosService => ({
  listar: (contexto) => repository.list(contexto),
  buscarPorId: async (contexto, id) => {
    const aluno = await repository.findById(contexto, id);
    if (!aluno) throw new NotFoundError('Aluno não encontrado.');
    return aluno;
  },
});
