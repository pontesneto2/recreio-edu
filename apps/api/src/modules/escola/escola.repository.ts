import type { Escola, EscolaPublica } from '@recreio/contracts';
import { asc, count, eq } from 'drizzle-orm';
import type { WithEscola } from '../../database/escola-context.ts';
import { alunos, escolas, unidades } from '../../database/schema/index.ts';
import type { EscolaContexto } from '../../shared/tenant/escola-contexto.ts';

/** Dados guardados no banco. A data de hoje vem do service. */
export type DadosEscola = Omit<Escola, 'hoje'>;

export type EscolaRepository = {
  get: (contexto: EscolaContexto) => Promise<DadosEscola | undefined>;
  getPublica: (contexto: EscolaContexto) => Promise<EscolaPublica | undefined>;
};

export const createDrizzleEscolaRepository = (withEscola: WithEscola): EscolaRepository => ({
  get: ({ escolaId }) =>
    withEscola(escolaId, async (tx) => {
      const [escola] = await tx
        .select({ nome: escolas.nome, cnpj: escolas.cnpj, cidade: escolas.cidade, corMarca: escolas.corMarca })
        .from(escolas)
        .where(eq(escolas.id, escolaId));
      if (!escola) return undefined;

      const listaUnidades = await tx
        .select({ id: unidades.id, nome: unidades.nome, alunos: count(alunos.id) })
        .from(unidades)
        .leftJoin(alunos, eq(alunos.unidadeId, unidades.id))
        .where(eq(unidades.escolaId, escolaId))
        .groupBy(unidades.id)
        .orderBy(asc(unidades.nome));

      return { ...escola, unidades: listaUnidades };
    }),
  getPublica: ({ escolaId }) =>
    withEscola(escolaId, async (tx) => {
      const [escola] = await tx
        .select({ slug: escolas.slug, nome: escolas.nome, cidade: escolas.cidade, corMarca: escolas.corMarca })
        .from(escolas)
        .where(eq(escolas.id, escolaId));
      return escola;
    }),
});
