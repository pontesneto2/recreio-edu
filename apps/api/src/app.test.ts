import { alunoSchema, escolaSchema, problemSchema } from '@recreio/contracts';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { z } from 'zod';
import { createApp } from './app.ts';
import { type Container, createContainer } from './container.ts';
import { seedDadosCanonicos } from './database/seed/seed.ts';
import { openApiDocument } from './openapi.ts';
import { type BancoDeTeste, iniciarBancoDeTeste } from './test/database.ts';
import { requisitar } from './test/http.ts';
import { iniciarRedisDeTeste, type RedisDeTeste } from './test/redis.ts';
import { useServer } from './test/server.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const DOMINIO = 'colegiorecreio.localhost';
const ALUNO_INEXISTENTE = '7a1e2b3c-0000-4000-8000-000000000000';
const statusSchema = z.object({ status: z.string() });

/** Confere o `Content-Type` e o corpo RFC 9457 e devolve o problema lido. */
const readProblem = async (res: Response, status: number, code: string) => {
  assert.equal(res.status, status);
  assert.match(res.headers.get('content-type') ?? '', /^application\/problem\+json/);
  const problem = problemSchema.parse(await res.json());
  assert.equal(problem.status, status);
  assert.equal(problem.code, code);
  return problem;
};

// Um PostgreSQL com migrações e seed e um Redis para o arquivo todo. O fetch sai de 127.0.0.1,
// que a API trata como DEV_ESCOLA_DOMINIO.
let banco: BancoDeTeste;
let redis: RedisDeTeste;
let container: Container;

/** Porta 1 recusa a conexão na hora. */
const REDIS_FORA = 'redis://127.0.0.1:1';

before(async () => {
  [banco, redis] = await Promise.all([iniciarBancoDeTeste(), iniciarRedisDeTeste()]);
  await seedDadosCanonicos(banco.urlDono, DOMINIO);
  container = createContainer({ databaseUrl: banco.urlApp, dominioLocal: DOMINIO, redisUrl: redis.url });
});

after(async () => {
  await container?.encerrar();
  await Promise.all([banco?.parar(), redis?.parar()]);
});

describe('API HTTP', () => {
  const server = useServer(() => createApp(container));

  test('GET /api/health responde ok, fora da versão', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal(statusSchema.parse(await res.json()).status, 'ok');
  });

  test('GET /api/ready responde ok com Postgres e Redis no ar', async () => {
    const res = await fetch(`${server.baseUrl}/api/ready`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), { status: 'ok', dependencias: { postgres: 'ok', redis: 'ok' } });
  });

  test('GET /api/v1/escola devolve a escola com a contagem de alunos por unidade', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/escola`);
    assert.equal(res.status, 200);
    const escola = escolaSchema.parse(await res.json());
    assert.equal(escola.nome, 'Colégio Recreio');
    assert.equal(escola.cnpj, '07.412.386/0001-52');
    assert.deepEqual(
      escola.unidades.map(({ nome, alunos }) => ({ nome, alunos })),
      [
        { nome: 'Unidade Aldeota', alunos: 2 },
        { nome: 'Unidade Eusébio', alunos: 0 },
      ],
    );
  });

  test('GET /api/v1/alunos devolve os alunos do seed', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos`);
    assert.equal(res.status, 200);
    const alunos = alunoSchema.array().parse(await res.json());
    assert.deepEqual(
      alunos.map(({ nome, turma, turno, matricula, mensalidadeCentavos }) => ({
        nome,
        turma,
        turno,
        matricula,
        mensalidadeCentavos,
      })),
      [
        {
          nome: 'Ana Beatriz Lima',
          turma: '9º ano A',
          turno: 'Manhã',
          matricula: '2018-0214',
          mensalidadeCentavos: 162000,
        },
        { nome: 'Davi Lima', turma: '2º ano B', turno: 'Manhã', matricula: '2024-0318', mensalidadeCentavos: 148000 },
      ],
    );
  });

  test('GET /api/v1/alunos/:id devolve o aluno', async () => {
    const lista = alunoSchema.array().parse(await (await fetch(`${server.baseUrl}/api/v1/alunos`)).json());
    const davi = lista.find((aluno) => aluno.nome === 'Davi Lima');
    assert.ok(davi);

    const res = await fetch(`${server.baseUrl}/api/v1/alunos/${davi.id}`);
    assert.equal(res.status, 200);
    assert.deepEqual(alunoSchema.parse(await res.json()), davi);
  });

  test('GET /api/v1/alunos/:id devolve 404 NAO_ENCONTRADO em problem+json', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos/${ALUNO_INEXISTENTE}`);
    const problem = await readProblem(res, 404, 'NAO_ENCONTRADO');
    assert.equal(problem.type, 'https://recreio.app/problemas/nao-encontrado');
    assert.equal(problem.title, 'Recurso não encontrado');
    assert.equal(problem.detail, 'Aluno não encontrado.');
    assert.equal(problem.instance, `/api/v1/alunos/${ALUNO_INEXISTENTE}`);
  });

  test('GET /api/v1/alunos/:id devolve 400 DADOS_INVALIDOS com erros por campo', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos/${encodeURIComponent('ID Inválido')}?cpf=123`);
    const problem = await readProblem(res, 400, 'DADOS_INVALIDOS');
    assert.equal(problem.type, 'https://recreio.app/problemas/dados-invalidos');
    assert.ok(problem.errors?.id?.length, 'esperava mensagem para o campo id');
    assert.equal(problem.instance, '/api/v1/alunos/ID%20Inv%C3%A1lido', 'instance não leva a query');
  });

  test('corpo que não é JSON devolve 400 DADOS_INVALIDOS', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"nome":',
    });
    await readProblem(res, 400, 'DADOS_INVALIDOS');
  });

  test('corpo acima de 1 MB devolve 413 CORPO_GRANDE_DEMAIS', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome: 'x'.repeat(1_100_000) }),
    });
    const problem = await readProblem(res, 413, 'CORPO_GRANDE_DEMAIS');
    assert.equal(problem.type, 'https://recreio.app/problemas/corpo-grande-demais');
    assert.equal(problem.detail, 'O corpo da requisição passa do limite de 1024 KB.');
  });

  test('rota desconhecida devolve 404 NAO_ENCONTRADO', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/nada`);
    const problem = await readProblem(res, 404, 'NAO_ENCONTRADO');
    assert.equal(problem.detail, 'Rota GET /api/v1/nada não encontrada.');
  });

  test('rota sem versão não existe mais', async () => {
    const res = await fetch(`${server.baseUrl}/api/alunos`);
    await readProblem(res, 404, 'NAO_ENCONTRADO');
  });
});

describe('escola pelo Host', () => {
  const server = useServer(() => createApp(container));

  test('o domínio da escola, com ou sem porta, devolve os dados dela', async () => {
    for (const host of [DOMINIO, `${DOMINIO}:3333`, 'localhost:5173']) {
      const res = await requisitar(server.port, '/api/v1/escola', host);
      assert.equal(res.status, 200, host);
      assert.equal(escolaSchema.parse(res.corpo).nome, 'Colégio Recreio');
    }
  });

  test('Host sem escola cadastrada devolve 404 NAO_ENCONTRADO em problem+json', async () => {
    for (const caminho of ['/api/v1/escola', '/api/v1/alunos']) {
      const res = await requisitar(server.port, caminho, 'escola-que-nao-existe.recreio.app');
      assert.equal(res.status, 404, caminho);
      assert.match(res.contentType, /^application\/problem\+json/);
      const problem = problemSchema.parse(res.corpo);
      assert.equal(problem.code, 'NAO_ENCONTRADO');
      assert.equal(problem.detail, 'Escola não encontrada para este endereço.');
    }
  });

  test('health, ready e a documentação não dependem do Host', async () => {
    for (const caminho of ['/api/health', '/api/ready', '/api/docs', '/api/v1/openapi.json']) {
      const res = await requisitar(server.port, caminho, 'escola-que-nao-existe.recreio.app');
      assert.equal(res.status, 200, caminho);
    }
  });
});

describe('X-Request-Id', () => {
  const server = useServer(() => createApp(container));
  const requestId = async (header?: string) => {
    const res = await fetch(`${server.baseUrl}/api/v1/escola`, {
      headers: header === undefined ? {} : { 'X-Request-Id': header },
    });
    return res.headers.get('x-request-id');
  };

  test('gera um UUID quando o cliente não envia', async () => {
    assert.match((await requestId()) ?? '', UUID);
  });

  test('devolve o id que o cliente enviou', async () => {
    assert.equal(await requestId('portal-1f3a.9:b_c'), 'portal-1f3a.9:b_c');
  });

  test('troca por um UUID o id com caractere inseguro', async () => {
    assert.match((await requestId('id com espaço<script>')) ?? '', UUID);
  });

  test('troca por um UUID o id com mais de 128 caracteres', async () => {
    assert.equal(await requestId('a'.repeat(128)), 'a'.repeat(128));
    assert.match((await requestId('a'.repeat(129))) ?? '', UUID);
  });

  test('vai também nas respostas de erro', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos/${ALUNO_INEXISTENTE}`, {
      headers: { 'X-Request-Id': 'erro-1' },
    });
    assert.equal(res.status, 404);
    assert.equal(res.headers.get('x-request-id'), 'erro-1');
  });
});

describe('erro não previsto', () => {
  const server = useServer(() =>
    createApp({
      ...container,
      escolaService: {
        obter: async () => {
          throw new Error('senha do banco: segredo');
        },
      },
    }),
  );

  test('devolve 500 ERRO_INTERNO sem vazar a mensagem original', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/escola`);
    const problem = await readProblem(res, 500, 'ERRO_INTERNO');
    assert.equal(problem.detail, 'Erro interno. Tente de novo em instantes.');
    assert.doesNotMatch(JSON.stringify(problem), /segredo/);
  });
});

describe('limite de requisições', () => {
  const server = useServer(() => createApp(container, { rateLimitPerMinute: 2 }));

  test('a 3ª requisição no minuto recebe 429 LIMITE_EXCEDIDO com Retry-After', async () => {
    const primeira = await fetch(`${server.baseUrl}/api/v1/escola`);
    assert.equal(primeira.status, 200);
    assert.match(primeira.headers.get('ratelimit-policy') ?? '', /q=2; w=60/);
    assert.match(primeira.headers.get('ratelimit') ?? '', /r=1; t=\d+/);
    await fetch(`${server.baseUrl}/api/v1/escola`);

    const res = await fetch(`${server.baseUrl}/api/v1/escola`);
    const problem = await readProblem(res, 429, 'LIMITE_EXCEDIDO');
    assert.equal(problem.type, 'https://recreio.app/problemas/limite-excedido');
    assert.match(res.headers.get('retry-after') ?? '', /^\d+$/);
  });

  test('/api/health fica fora do limite', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(res.status, 200);
  });

  test('o contador fica no Redis', async () => {
    assert.ok(container.redis);
    const chaves = await container.redis.keys('recreio:limite:*');
    assert.ok(chaves.length > 0, 'esperava a chave do contador no Redis');
  });

  test('atrás de proxy confiável (loopback), o limite conta por IP de X-Forwarded-For', async () => {
    const comIp = (ip: string) => fetch(`${server.baseUrl}/api/v1/escola`, { headers: { 'X-Forwarded-For': ip } });
    assert.equal((await comIp('203.0.113.10')).status, 200);
    assert.equal((await comIp('203.0.113.10')).status, 200);
    assert.equal((await comIp('203.0.113.10')).status, 429);
    assert.equal((await comIp('203.0.113.11')).status, 200, 'outro cliente tem a própria cota');
  });
});

describe('limite de requisições sem Redis', () => {
  const server = useServer(() => createApp({ ...container, redis: undefined }, { rateLimitPerMinute: 1 }));

  test('conta em memória', async () => {
    assert.equal((await fetch(`${server.baseUrl}/api/v1/escola`)).status, 200);
    assert.equal((await fetch(`${server.baseUrl}/api/v1/escola`)).status, 429);
  });
});

describe('documentação da API', () => {
  const server = useServer(() => createApp(container));

  test('GET /api/v1/openapi.json devolve o documento gerado dos contratos', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/openapi.json`);
    assert.equal(res.status, 200);
    assert.deepEqual(await res.json(), JSON.parse(JSON.stringify(openApiDocument)));
  });

  test('GET /api/docs devolve a página HTML com CSP própria e nonce', async () => {
    const res = await fetch(`${server.baseUrl}/api/docs`);
    assert.equal(res.status, 200);
    assert.match(res.headers.get('content-type') ?? '', /^text\/html/);

    const html = await res.text();
    assert.match(html, /\/api\/v1\/openapi\.json/);
    const nonce = /script-src 'nonce-([^']+)'/.exec(res.headers.get('content-security-policy') ?? '')?.[1];
    assert.ok(nonce, 'esperava nonce na CSP');
    assert.ok(html.includes(`nonce="${nonce}"`), 'os scripts da página usam o nonce da CSP');
  });

  test('o resto da API mantém a CSP padrão do helmet', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/escola`);
    assert.match(res.headers.get('content-security-policy') ?? '', /script-src 'self'/);
  });
});

describe('API HTTP sem banco e sem Redis', () => {
  // Porta 1 recusa a conexão na hora.
  const semBanco = createContainer({
    databaseUrl: 'postgres://recreio_app:recreio_app@127.0.0.1:1/recreio',
    redisUrl: REDIS_FORA,
  });
  const server = useServer(() => createApp(semBanco));

  after(async () => {
    await semBanco.encerrar();
  });

  test('GET /api/ready devolve 503 e aponta as 2 dependências', async () => {
    const res = await fetch(`${server.baseUrl}/api/ready`);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), {
      status: 'indisponivel',
      dependencias: { postgres: 'indisponivel', redis: 'indisponivel' },
    });
  });

  test('GET /api/health continua 200', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(res.status, 200);
  });
});

describe('API HTTP só sem Redis', () => {
  let semRedis: Container | undefined;
  // A fábrica roda no `before` do useServer, depois que o banco do arquivo subiu.
  const server = useServer(() => {
    semRedis = createContainer({ databaseUrl: banco.urlApp, dominioLocal: DOMINIO, redisUrl: REDIS_FORA });
    return createApp(semRedis);
  });

  after(async () => {
    await semRedis?.encerrar();
  });

  test('GET /api/ready devolve 503 com o Postgres ok e o Redis indisponível', async () => {
    const res = await fetch(`${server.baseUrl}/api/ready`);
    assert.equal(res.status, 503);
    assert.deepEqual(await res.json(), {
      status: 'indisponivel',
      dependencias: { postgres: 'ok', redis: 'indisponivel' },
    });
  });
});
