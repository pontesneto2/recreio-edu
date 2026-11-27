import type { Aluno } from '@recreio/contracts';
import { and, asc, eq } from 'drizzle-orm';
import type { WithEscola } from '../../database/escola-context.ts';
import { type Turno, alunos, turmas } from '../../database/schema/index.ts';
import type { EscolaContexto } from '../../shared/tenant/escola-contexto.ts';

export type AlunosRepository = {
  list: (contexto: EscolaContexto) => Promise<Aluno[]>;
  findById: (contexto: EscolaContexto, id: string) => Promise<Aluno | undefined>;
};

const ROTULO_TURNO: Record<Turno, string> = {
  manha: 'Manhã',
  tarde: 'Tarde',
  integral: 'Integral',
  noite: 'Noite',
};

const colunas = {
  id: alunos.id,
  nome: alunos.nome,
  turma: turmas.nome,
  turno: turmas.turno,
  matricula: alunos.matricula,
  mensalidadeCentavos: alunos.mensalidadeCentavos,
};

const paraAluno = (linha: Omit<Aluno, 'turno'> & { turno: Turno }): Aluno => ({
  ...linha,
  turno: ROTULO_TURNO[linha.turno],
});

/** O filtro por escola_id repete a política de RLS. Um vazamento exige falha nas 2 barreiras. */
export const createDrizzleAlunosRepository = (withEscola: WithEscola): AlunosRepository => ({
  list: ({ escolaId }) =>
    withEscola(escolaId, async (tx) => {
      const linhas = await tx
        .select(colunas)
        .from(alunos)
        .innerJoin(turmas, eq(turmas.id, alunos.turmaId))
        .where(eq(alunos.escolaId, escolaId))
        .orderBy(asc(alunos.nome));
      return linhas.map(paraAluno);
    }),
  findById: ({ escolaId }, id) =>
    withEscola(escolaId, async (tx) => {
      const [linha] = await tx
        .select(colunas)
        .from(alunos)
        .innerJoin(turmas, eq(turmas.id, alunos.turmaId))
        .where(and(eq(alunos.escolaId, escolaId), eq(alunos.id, id)));
      return linha && paraAluno(linha);
    }),
});
