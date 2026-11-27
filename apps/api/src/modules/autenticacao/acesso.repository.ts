import {
  type Acao,
  type EscolaDoUsuario,
  type Modulo,
  PERFIS_DE_VINCULO,
  type PerfilDeVinculo,
  perfilDeVinculoSchema,
} from '@recreio/contracts';
import { and, arrayContains, eq, inArray } from 'drizzle-orm';
import type { Database } from '../../database/client.ts';
import { type WithEscola, buscarVinculosDoUsuario } from '../../database/escola-context.ts';
import { permissoes, vinculos } from '../../database/schema/index.ts';
import type { EscolaContexto } from '../../shared/tenant/escola-contexto.ts';

export type AcessoRepository = {
  /** Escolas em que a conta tem vínculo, com os perfis em cada uma. Única leitura entre escolas. */
  escolasDoUsuario: (usuarioId: string) => Promise<EscolaDoUsuario[]>;
  /** Perfis da pessoa na escola, na ordem de `PERFIS_DE_VINCULO`. Lista vazia quando não há vínculo. */
  perfisDoUsuario: (contexto: EscolaContexto, usuarioId: string) => Promise<PerfilDeVinculo[]>;
  /** Diz se algum dos perfis tem a ação no módulo. */
  temPermissao: (
    contexto: EscolaContexto,
    perfis: readonly PerfilDeVinculo[],
    modulo: Modulo,
    acao: Acao,
  ) => Promise<boolean>;
};

const ordemDoPerfil = (perfil: PerfilDeVinculo) => PERFIS_DE_VINCULO.indexOf(perfil);

/** O filtro por escola_id repete a política de RLS, como nos outros repositórios. */
export const createDrizzleAcessoRepository = (db: Database, withEscola: WithEscola): AcessoRepository => ({
  escolasDoUsuario: async (usuarioId) => {
    const porSlug = new Map<string, EscolaDoUsuario>();
    for (const { slug, nome, perfil } of await buscarVinculosDoUsuario(db, usuarioId)) {
      const escola = porSlug.get(slug) ?? { slug, nome, perfis: [] };
      escola.perfis.push(perfilDeVinculoSchema.parse(perfil));
      porSlug.set(slug, escola);
    }
    return [...porSlug.values()].map((escola) => ({
      ...escola,
      perfis: escola.perfis.sort((a, b) => ordemDoPerfil(a) - ordemDoPerfil(b)),
    }));
  },
  perfisDoUsuario: ({ escolaId }, usuarioId) =>
    withEscola(escolaId, async (tx) => {
      const linhas = await tx
        .select({ perfil: vinculos.perfil })
        .from(vinculos)
        .where(and(eq(vinculos.escolaId, escolaId), eq(vinculos.usuarioId, usuarioId)));
      return linhas.map((linha) => linha.perfil).sort((a, b) => ordemDoPerfil(a) - ordemDoPerfil(b));
    }),
  temPermissao: ({ escolaId }, perfis, modulo, acao) =>
    withEscola(escolaId, async (tx) => {
      if (perfis.length === 0) return false;
      const [linha] = await tx
        .select({ id: permissoes.id })
        .from(permissoes)
        .where(
          and(
            eq(permissoes.escolaId, escolaId),
            inArray(permissoes.perfil, [...perfis]),
            eq(permissoes.modulo, modulo),
            arrayContains(permissoes.acoes, [acao]),
          ),
        )
        .limit(1);
      return linha !== undefined;
    }),
});
