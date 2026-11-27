import { alunoSchema, escolaSchema, problemSchema } from '@recreio/contracts';
import assert from 'node:assert/strict';
import { describe, test } from 'node:test';
import { createApp } from './app.ts';
import { createContainer } from './container.ts';
import { openApiDocument } from './openapi.ts';
import { useServer } from './test/server.ts';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** Confere o `Content-Type` e o corpo RFC 9457 e devolve o problema lido. */
const readProblem = async (res: Response, status: number, code: string) => {
  assert.equal(res.status, status);
  assert.match(res.headers.get('content-type') ?? '', /^application\/problem\+json/);
  const problem = problemSchema.parse(await res.json());
  assert.equal(problem.status, status);
  assert.equal(problem.code, code);
  return problem;
};

describe('API HTTP', () => {
  const server = useServer(() => createApp(createContainer()));

  test('GET /api/health responde ok, fora da versão', async () => {
    const res = await fetch(`${server.baseUrl}/api/health`);
    assert.equal(res.status, 200);
    assert.equal((await res.json()).status, 'ok');
  });

  test('GET /api/v1/escola segue o contrato', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/escola`);
    assert.equal(res.status, 200);
    escolaSchema.parse(await res.json());
  });

  test('GET /api/v1/alunos segue o contrato', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos`);
    alunoSchema
      .array()
      .min(1)
      .parse(await res.json());
  });

  test('GET /api/v1/alunos/:id devolve 404 NAO_ENCONTRADO em problem+json', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/alunos/nao-existe`);
    const problem = await readProblem(res, 404, 'NAO_ENCONTRADO');
    assert.equal(problem.type, 'https://recreio.app/problemas/nao-encontrado');
    assert.equal(problem.title, 'Recurso não encontrado');
    assert.equal(problem.detail, 'Aluno não encontrado.');
    assert.equal(problem.instance, '/api/v1/alunos/nao-existe');
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

describe('X-Request-Id', () => {
  const server = useServer(() => createApp(createContainer()));
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
    const res = await fetch(`${server.baseUrl}/api/v1/alunos/nao-existe`, { headers: { 'X-Request-Id': 'erro-1' } });
    assert.equal(res.headers.get('x-request-id'), 'erro-1');
  });
});

describe('erro não previsto', () => {
  const server = useServer(() =>
    createApp({
      ...createContainer(),
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
  const server = useServer(() => createApp(createContainer(), { rateLimitPerMinute: 2 }));

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
});

describe('documentação da API', () => {
  const server = useServer(() => createApp(createContainer()));

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
