import { sql } from 'drizzle-orm';
import { type Database, createConexaoBanco } from '../client.ts';
import { createWithEscola } from '../escola-context.ts';
import { alunos, escolas, turmas, unidades } from '../schema/index.ts';
import { type DadosEscolaSeed, colegioRecreio } from './dados-canonicos.ts';

const chave = (...partes: (string | number)[]) => partes.join('|');

const buscar = <T>(mapa: Map<string, T>, chaveBusca: string): T => {
  const valor = mapa.get(chaveBusca);
  if (valor === undefined) throw new Error(`Seed inconsistente: ${chaveBusca} não existe.`);
  return valor;
};

/**
 * Grava uma escola com unidades, turmas e alunos. Roda de novo sem duplicar: cada
 * insert atualiza a linha que já existe pela chave natural (domínio, slug, matrícula).
 * Usa a conexão do dono; unidades, turmas e alunos têm FORCE RLS, então rodam com app.escola_id.
 */
export const seedEscola = async (db: Database, dados: DadosEscolaSeed): Promise<string> => {
  const [escola] = await db
    .insert(escolas)
    .values(dados.escola)
    .onConflictDoUpdate({
      target: escolas.dominio,
      set: {
        nome: sql`excluded.nome`,
        cnpj: sql`excluded.cnpj`,
        cidade: sql`excluded.cidade`,
        corMarca: sql`excluded.cor_marca`,
        atualizadoEm: sql`now()`,
      },
    })
    .returning({ id: escolas.id });
  if (!escola) throw new Error('Seed: a escola não foi gravada.');
  const escolaId = escola.id;

  await createWithEscola(db)(escolaId, async (tx) => {
    const linhasUnidades = await tx
      .insert(unidades)
      .values(dados.unidades.map((unidade) => ({ ...unidade, escolaId })))
      .onConflictDoUpdate({ target: [unidades.escolaId, unidades.slug], set: { nome: sql`excluded.nome` } })
      .returning({ id: unidades.id, slug: unidades.slug });
    const unidadePorSlug = new Map(linhasUnidades.map((linha) => [linha.slug, linha.id]));

    const linhasTurmas = await tx
      .insert(turmas)
      .values(
        dados.turmas.map(({ unidade, ...turma }) => ({
          ...turma,
          escolaId,
          unidadeId: buscar(unidadePorSlug, unidade),
        })),
      )
      .onConflictDoUpdate({
        target: [turmas.unidadeId, turmas.anoLetivo, turmas.nome],
        set: { turno: sql`excluded.turno` },
      })
      .returning({ id: turmas.id, unidadeId: turmas.unidadeId, nome: turmas.nome });
    const turmaPorNome = new Map(linhasTurmas.map((linha) => [chave(linha.unidadeId, linha.nome), linha.id]));

    await tx
      .insert(alunos)
      .values(
        dados.alunos.map(({ unidade, turma, ...aluno }) => {
          const unidadeId = buscar(unidadePorSlug, unidade);
          return { ...aluno, escolaId, unidadeId, turmaId: buscar(turmaPorNome, chave(unidadeId, turma)) };
        }),
      )
      .onConflictDoUpdate({
        target: [alunos.escolaId, alunos.matricula],
        set: {
          nome: sql`excluded.nome`,
          unidadeId: sql`excluded.unidade_id`,
          turmaId: sql`excluded.turma_id`,
          mensalidadeCentavos: sql`excluded.mensalidade_centavos`,
          atualizadoEm: sql`now()`,
        },
      });
  });

  return escolaId;
};

/** Grava o Colégio Recreio no domínio informado. Devolve o id da escola. */
export const seedDadosCanonicos = async (urlDono: string, dominio: string): Promise<string> => {
  const conexao = createConexaoBanco(urlDono);
  try {
    return await seedEscola(conexao.db, colegioRecreio(dominio));
  } finally {
    await conexao.encerrar();
  }
};
