import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { sql } from 'drizzle-orm';
import pg from 'pg';
import { type BancoDeTeste, iniciarBancoDeTeste } from '../test/database.ts';
import { type ConexaoBanco, createConexaoBanco } from './client.ts';
import { buscarEscolaPorDominio, createWithEscola } from './escola-context.ts';
import { seedDadosCanonicos, seedEscola } from './seed/seed.ts';

const TABELAS_DA_ESCOLA = ['unidades', 'turmas', 'alunos'] as const;
const CODIGO_SEM_PERMISSAO = '42501';

const escolaB = {
  escola: {
    nome: 'Escola Outra',
    cnpj: '11.222.333/0001-81',
    cidade: 'Caucaia',
    corMarca: '#22AA55',
    dominio: 'outra.localhost',
  },
  unidades: [{ slug: 'centro', nome: 'Unidade Centro' }],
  turmas: [{ unidade: 'centro', nome: '5º ano A', turno: 'tarde' as const, anoLetivo: 2026 }],
  alunos: [
    { unidade: 'centro', turma: '5º ano A', nome: 'Bruno Costa', matricula: '2025-0001', mensalidadeCentavos: 99000 },
  ],
};

/** Erro do Postgres que o Drizzle embrulha em `cause`. */
const codigoPg = (erro: unknown): string | undefined => {
  const causa = erro instanceof Error && erro.cause instanceof Error ? erro.cause : erro;
  return causa instanceof Error && 'code' in causa ? String(causa.code) : undefined;
};

describe('Row Level Security por escola', () => {
  let banco: BancoDeTeste;
  let dono: ConexaoBanco;
  let app: ConexaoBanco;
  let escolaA = '';
  let idEscolaB = '';

  before(async () => {
    banco = await iniciarBancoDeTeste();
    escolaA = await seedDadosCanonicos(banco.urlDono, 'colegiorecreio.localhost');
    dono = createConexaoBanco(banco.urlDono);
    idEscolaB = await seedEscola(dono.db, escolaB);
    app = createConexaoBanco(banco.urlApp);
  });

  after(async () => {
    await app?.encerrar();
    await dono?.encerrar();
    await banco?.parar();
  });

  test('consulta sem filtro dentro da escola A só devolve linhas da escola A', async () => {
    const withEscola = createWithEscola(app.db);
    for (const [escola, outra] of [
      [escolaA, idEscolaB],
      [idEscolaB, escolaA],
    ] as const) {
      await withEscola(escola, async (tx) => {
        for (const tabela of TABELAS_DA_ESCOLA) {
          const { rows } = await tx.execute<{ escola_id: string }>(
            sql`select escola_id from ${sql.identifier(tabela)}`,
          );
          assert.ok(rows.length > 0, `${tabela} sem linhas para a escola`);
          assert.ok(
            rows.every((linha) => linha.escola_id === escola),
            `${tabela} devolveu linha de ${outra}`,
          );
        }
        const { rows } = await tx.execute<{ id: string }>(sql`select id from escolas`);
        assert.deepEqual(
          rows.map((linha) => linha.id),
          [escola],
        );
      });
    }
  });

  test('o dono enxerga as 2 escolas, então o isolamento vem da política', async () => {
    const { rows } = await dono.db.execute<{ total: number }>(sql`select count(*)::int as total from alunos`);
    assert.equal(rows[0]?.total, 3);
  });

  test('recreio_app sem app.escola_id não vê nenhuma linha', async () => {
    for (const tabela of [...TABELAS_DA_ESCOLA, 'escolas']) {
      const { rows } = await app.db.execute<{ total: number }>(
        sql`select count(*)::int as total from ${sql.identifier(tabela)}`,
      );
      assert.equal(rows[0]?.total, 0, tabela);
    }
  });

  test('a mesma conexão volta a não ver nada quando a transação da escola termina', async () => {
    const cliente = new pg.Client({ connectionString: banco.urlApp });
    await cliente.connect();
    try {
      await cliente.query('begin');
      await cliente.query(`select set_config('app.escola_id', $1, true)`, [escolaA]);
      assert.equal((await cliente.query('select count(*)::int as total from alunos')).rows[0].total, 2);
      await cliente.query('commit');
      // Depois do commit o valor fica '' e não NULL. A política trata os 2 casos.
      assert.equal((await cliente.query('select count(*)::int as total from alunos')).rows[0].total, 0);
    } finally {
      await cliente.end();
    }
  });

  test('não grava linha com escola_id de outra escola', async () => {
    const withEscola = createWithEscola(app.db);
    await assert.rejects(
      withEscola(escolaA, (tx) =>
        tx.execute(sql`insert into unidades (escola_id, slug, nome) values (${idEscolaB}, 'invasora', 'Invasora')`),
      ),
      (erro) => codigoPg(erro) === CODIGO_SEM_PERMISSAO,
    );
  });

  test('recreio_app não cria escola', async () => {
    await assert.rejects(
      app.db.execute(
        sql`insert into escolas (nome, cnpj, cidade, cor_marca, dominio) values ('X', '1', 'X', '#000000', 'x.localhost')`,
      ),
      (erro) => codigoPg(erro) === CODIGO_SEM_PERMISSAO,
    );
  });

  test('escola_por_dominio resolve o domínio sem app.escola_id', async () => {
    assert.equal(await buscarEscolaPorDominio(app.db, 'colegiorecreio.localhost'), escolaA);
    assert.equal(await buscarEscolaPorDominio(app.db, 'OUTRA.localhost'), idEscolaB);
    assert.equal(await buscarEscolaPorDominio(app.db, 'nao-existe.localhost'), undefined);
  });

  test('o seed roda de novo sem duplicar', async () => {
    assert.equal(await seedDadosCanonicos(banco.urlDono, 'colegiorecreio.localhost'), escolaA);
    const { rows } = await dono.db.execute<{ total: number }>(
      sql`select count(*)::int as total from alunos where escola_id = ${escolaA}`,
    );
    assert.equal(rows[0]?.total, 2);
  });
});
