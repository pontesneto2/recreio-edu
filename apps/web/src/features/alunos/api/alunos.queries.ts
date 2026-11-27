import { alunoSchema } from '@recreio/contracts';
import { queryOptions } from '@tanstack/react-query';
import { getJson } from '@/shared/api/http-client.ts';

export const alunosKeys = {
  all: ['alunos'] as const,
  detail: (id: string) => ['alunos', id] as const,
};

export const alunosQuery = queryOptions({
  queryKey: alunosKeys.all,
  queryFn: () => getJson('/api/v1/alunos', alunoSchema.array()),
});

export const alunoQuery = (id: string) =>
  queryOptions({
    queryKey: alunosKeys.detail(id),
    queryFn: () => getJson(`/api/v1/alunos/${encodeURIComponent(id)}`, alunoSchema),
  });
