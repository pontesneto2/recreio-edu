import { escolaPublicaSchema, escolaSchema } from '@recreio/contracts';
import { queryOptions } from '@tanstack/react-query';
import { getJson } from '@/shared/api/http-client.ts';

/** Toda chave começa pelo slug: dado de uma escola nunca aparece na tela de outra (ADR 0011). */
export const escolaKeys = {
  all: (escola: string) => ['escola', escola] as const,
  publica: (escola: string) => ['escola', escola, 'publica'] as const,
};

const rotaDaEscola = (escola: string) => `/api/v1/escolas/${encodeURIComponent(escola)}`;

/** Dados do painel. Exige sessão com `painel:ver`. */
export const escolaQuery = (escola: string) =>
  queryOptions({
    queryKey: escolaKeys.all(escola),
    queryFn: () => getJson(rotaDaEscola(escola), escolaSchema),
  });

/** Nome, cidade e cor da escola. Responde sem login, para a tela de entrada e o tema. */
export const escolaPublicaQuery = (escola: string) =>
  queryOptions({
    queryKey: escolaKeys.publica(escola),
    queryFn: () => getJson(`${rotaDaEscola(escola)}/publica`, escolaPublicaSchema),
    staleTime: 10 * 60_000,
  });
