import { alunoSchema } from '@recreio/contracts';
import { queryOptions } from '@tanstack/react-query';
import { getJson } from '@/shared/api/http-client.ts';

/** Toda chave começa pelo slug da escola (ADR 0011). */
export const alunosKeys = {
  all: (escola: string) => ['alunos', escola] as const,
  detail: (escola: string, id: string) => ['alunos', escola, id] as const,
};

const rotaDosAlunos = (escola: string) => `/api/v1/escolas/${encodeURIComponent(escola)}/alunos`;

export const alunosQuery = (escola: string) =>
  queryOptions({
    queryKey: alunosKeys.all(escola),
    queryFn: () => getJson(rotaDosAlunos(escola), alunoSchema.array()),
  });

export const alunoQuery = (escola: string, id: string) =>
  queryOptions({
    queryKey: alunosKeys.detail(escola, id),
    queryFn: () => getJson(`${rotaDosAlunos(escola)}/${encodeURIComponent(id)}`, alunoSchema),
  });
