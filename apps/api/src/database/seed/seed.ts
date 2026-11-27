import { hashPassword } from 'better-auth/crypto';
import { sql } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { env } from '../../config/env.ts';
import { type Database, type Transacao, createConexaoBanco } from '../client.ts';
import { createWithEscola } from '../escola-context.ts';
import { account, alunos, escolas, permissoes, turmas, unidades, user, vinculos } from '../schema/index.ts';
import { type DadosEscolaSeed, colegioRecreio } from './dados-canonicos.ts';
import { linhasDePermissao } from './permissoes-padrao.ts';

export type OpcoesDoSeed = {
  /** Senha das contas de demonstração. Sem ela, o seed grava a escola e as permissões, sem contas. */
  senhaPadrao?: string;
};

const chave = (...partes: (string | number)[]) => partes.join('|');

const buscar = <T>(mapa: Map<string, T>, chaveBusca: string): T => {
  const valor = mapa.get(chaveBusca);
  if (valor === undefined) throw new Error(`Seed inconsistente: ${chaveBusca} não existe.`);
  return valor;
};

/**
 * Grava uma escola com unidades, turmas e alunos. Roda de novo sem duplicar: cada
 * insert atualiza a linha que já existe pela chave natural (CNPJ, slug da unidade, matrícula).
 * Usa a conexão do dono; as tabelas da escola têm FORCE RLS, então rodam com app.escola_id.
 */
export const seedEscola = async (
  db: Database,
  dados: DadosEscolaSeed,
  { senhaPadrao }: OpcoesDoSeed = {},
): Promise<string> => {
  if (senhaPadrao && env.NODE_ENV === 'production') {
    throw new Error('Seed: contas com senha conhecida não entram em produção.');
  }
  const [escola] = await db
    .insert(escolas)
    .values(dados.escola)
    .onConflictDoUpdate({
      target: escolas.cnpj,
      set: {
        nome: sql`excluded.nome`,
        slug: sql`excluded.slug`,
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

    await seedPermissoes(tx, escolaId);
  });

  if (senhaPadrao && dados.usuarios?.length) {
    const usuarios = await Promise.all(dados.usuarios.map((usuario) => seedUsuario(db, usuario, senhaPadrao)));
    await createWithEscola(db)(escolaId, (tx) =>
      tx
        .insert(vinculos)
        .values(usuarios.flatMap(({ id, perfis }) => perfis.map((perfil) => ({ escolaId, usuarioId: id, perfil }))))
        .onConflictDoNothing({ target: [vinculos.escolaId, vinculos.usuarioId, vinculos.perfil] }),
    );
  }

  return escolaId;
};

/** Matriz padrão de permissões. Rodar de novo volta cada linha ao padrão. */
const seedPermissoes = async (tx: Transacao, escolaId: string) => {
  await tx
    .insert(permissoes)
    .values(linhasDePermissao().map((linha) => ({ ...linha, escolaId })))
    .onConflictDoUpdate({
      target: [permissoes.escolaId, permissoes.perfil, permissoes.modulo],
      set: { acoes: sql`excluded.acoes`, atualizadoEm: sql`now()` },
    });
};

type UsuarioSeed = NonNullable<DadosEscolaSeed['usuarios']>[number];

/**
 * Conta com e-mail confirmado e senha no formato do Better Auth (scrypt), na conta `credential`.
 * As tabelas de conta são globais: a mesma pessoa pode ter vínculo com mais de uma escola.
 */
const seedUsuario = async (db: Database, { nome, email, perfis }: UsuarioSeed, senha: string) => {
  const [linha] = await db
    .insert(user)
    .values({ id: randomUUID(), name: nome, email, emailVerified: true })
    .onConflictDoUpdate({
      target: user.email,
      set: { name: sql`excluded.name`, emailVerified: true, updatedAt: sql`now()` },
    })
    .returning({ id: user.id });
  if (!linha) throw new Error(`Seed: a conta ${email} não foi gravada.`);

  await db
    .insert(account)
    .values({
      id: randomUUID(),
      accountId: linha.id,
      providerId: 'credential',
      userId: linha.id,
      password: await hashPassword(senha),
    })
    .onConflictDoUpdate({
      target: [account.providerId, account.accountId],
      set: { password: sql`excluded.password`, updatedAt: sql`now()` },
    });

  return { id: linha.id, perfis };
};

/** Grava o Colégio Recreio. Devolve o id da escola. */
export const seedDadosCanonicos = async (urlDono: string, opcoes: OpcoesDoSeed = {}): Promise<string> => {
  const conexao = createConexaoBanco(urlDono);
  try {
    return await seedEscola(conexao.db, colegioRecreio(), opcoes);
  } finally {
    await conexao.encerrar();
  }
};
