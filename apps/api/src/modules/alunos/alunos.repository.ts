import type { Aluno } from '@recreio/contracts';

export type AlunosRepository = {
  list: () => Promise<Aluno[]>;
  findById: (id: string) => Promise<Aluno | undefined>;
};

/** Repositório em memória. Um repositório com banco implementa o mesmo tipo e o service não muda. */
export const createInMemoryAlunosRepository = (seed: readonly Aluno[]): AlunosRepository => {
  const alunos = [...seed];
  return {
    list: async () => alunos,
    findById: async (id) => alunos.find((aluno) => aluno.id === id),
  };
};
