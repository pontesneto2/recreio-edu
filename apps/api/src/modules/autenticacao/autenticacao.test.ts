import { euSchema, escolaPublicaSchema, problemSchema } from '@recreio/contracts';
import assert from 'node:assert/strict';
import { after, before, describe, test } from 'node:test';
import { createApp } from '../../app.ts';
import { type Container, createContainer } from '../../container.ts';
import { createConexaoBanco } from '../../database/client.ts';
import { seedDadosCanonicos, seedEscola } from '../../database/seed/seed.ts';
import type { EmailJob } from '../../shared/email/email-job.ts';
import { type BancoDeTeste, iniciarBancoDeTeste } from '../../test/database.ts';
import { useServer } from '../../test/server.ts';
import {
  EMAILS,
  ESCOLA,
  ORIGEM_DE_TESTE,
  SENHA_DE_TESTE,
  configDeTeste,
  cookieDaResposta,
  entrar,
  postarAuth,
  rotaDaEscola,
} from '../../test/sessao.ts';

const ESCOLA_SEM_VINCULO = 'escola-outra';

const lerProblema = async (res: Response, status: number, code: string) => {
  assert.equal(res.status, status);
  assert.match(res.headers.get('content-type') ?? '', /^application\/problem\+json/);
  const problema = problemSchema.parse(await res.json());
  assert.equal(problema.code, code);
  return problema;
};

/** Link do último e-mail enviado para o endereço. */
const linkDoEmail = (caixa: EmailJob[], para: string): URL => {
  const job = caixa.findLast((item) => item.para === para);
  assert.ok(job, `nenhum e-mail para ${para}`);
  assert.ok('link' in job.variaveis, 'e-mail sem link');
  return new URL(job.variaveis.link);
};

const comCookie = (cookie: string) => ({ headers: { Cookie: cookie } });

let banco: BancoDeTeste;
let container: Container;
let caixa: EmailJob[];

before(async () => {
  banco = await iniciarBancoDeTeste();
  await seedDadosCanonicos(banco.urlDono, { senhaPadrao: SENHA_DE_TESTE });
  const dono = createConexaoBanco(banco.urlDono);
  try {
    await seedEscola(dono.db, {
      escola: {
        nome: 'Escola Outra',
        cnpj: '11.222.333/0001-81',
        cidade: 'Caucaia',
        corMarca: '#22AA55',
        slug: ESCOLA_SEM_VINCULO,
      },
      unidades: [{ slug: 'centro', nome: 'Unidade Centro' }],
      turmas: [{ unidade: 'centro', nome: '5º ano A', turno: 'tarde', anoLetivo: 2026 }],
      alunos: [
        {
          unidade: 'centro',
          turma: '5º ano A',
          nome: 'Bruno Costa',
          matricula: '2025-0001',
          mensalidadeCentavos: 99000,
        },
      ],
    });
  } finally {
    await dono.encerrar();
  }
  const teste = configDeTeste(banco.urlApp);
  caixa = teste.caixa;
  container = createContainer(teste.config);
});

after(async () => {
  await container?.encerrar();
  await banco?.parar();
});

describe('entrar e sair', () => {
  const server = useServer(() => createApp(container));

  test('entrar define o cookie de sessão httpOnly, SameSite=Lax, com prefixo recreio', async () => {
    const res = await postarAuth(server.baseUrl, '/sign-in/email', { email: EMAILS.direcao, password: SENHA_DE_TESTE });
    assert.equal(res.status, 200);
    const sessao = res.headers.getSetCookie().find((cookie) => cookie.startsWith('recreio.session_token='));
    assert.ok(sessao, 'esperava o cookie recreio.session_token');
    assert.match(sessao, /HttpOnly/i);
    assert.match(sessao, /SameSite=Lax/i);
    assert.match(sessao, /Path=\//);
    assert.doesNotMatch(sessao, /;\s*Secure/i, 'fora de produção o cookie vale em http://localhost');
  });

  test('senha errada responde 401 sem cookie', async () => {
    const res = await postarAuth(server.baseUrl, '/sign-in/email', {
      email: EMAILS.direcao,
      password: 'senha-errada-123',
    });
    assert.equal(res.status, 401);
    assert.deepEqual(res.headers.getSetCookie(), []);
  });

  test('sair apaga a sessão e /eu volta a responder 401', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.direcao);
    assert.equal((await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(cookie))).status, 200);

    const saida = await postarAuth(server.baseUrl, '/sign-out', {}, cookie);
    assert.equal(saida.status, 200);

    await lerProblema(await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(cookie)), 401, 'NAO_AUTENTICADO');
  });
});

describe('cadastro com confirmação de e-mail', () => {
  const server = useServer(() => createApp(container));
  const email = 'marcos.novo@exemplo.test';
  const senha = 'senha-nova-2026';

  test('senha com menos de 10 caracteres é recusada', async () => {
    const res = await postarAuth(server.baseUrl, '/sign-up/email', {
      name: 'Senha Curta',
      email: 'curta@exemplo.test',
      password: '123456789',
    });
    assert.equal(res.status, 400);
    assert.equal(((await res.json()) as { code?: string }).code, 'PASSWORD_TOO_SHORT');
  });

  test('cadastro envia e-mail, entrar exige confirmação, o link confirma e abre a sessão', async () => {
    const cadastro = await postarAuth(server.baseUrl, '/sign-up/email', {
      name: 'Marcos Novo',
      email,
      password: senha,
    });
    assert.equal(cadastro.status, 200);
    assert.doesNotMatch(cookieDaResposta(cadastro), /session_token/, 'sem confirmação não há sessão');

    const antes = await postarAuth(server.baseUrl, '/sign-in/email', { email, password: senha });
    assert.equal(antes.status, 403);
    assert.equal(((await antes.json()) as { code?: string }).code, 'EMAIL_NOT_VERIFIED');

    const link = linkDoEmail(caixa, email);
    assert.equal(link.origin, ORIGEM_DE_TESTE);
    assert.equal(link.pathname, '/api/auth/verify-email');
    const confirmacao = await fetch(`${server.baseUrl}${link.pathname}${link.search}`, { redirect: 'manual' });
    assert.equal(confirmacao.status, 302);
    assert.match(cookieDaResposta(confirmacao), /recreio\.session_token=/);

    await entrar(server.baseUrl, email, senha);
  });

  test('conta sem vínculo: /eu traz lista vazia e a rota da escola responde 403 SEM_ACESSO', async () => {
    const cookie = await entrar(server.baseUrl, email, senha);
    const eu = euSchema.parse(await (await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(cookie))).json());
    assert.deepEqual(eu.escolas, []);
    const problema = await lerProblema(
      await fetch(`${server.baseUrl}${rotaDaEscola('/alunos')}`, comCookie(cookie)),
      403,
      'SEM_ACESSO',
    );
    assert.equal(problema.type, 'https://recreio.app/problemas/sem-acesso');
  });
});

describe('GET /api/v1/eu', () => {
  const server = useServer(() => createApp(container));

  test('sem cookie responde 401 NAO_AUTENTICADO', async () => {
    const problema = await lerProblema(await fetch(`${server.baseUrl}/api/v1/eu`), 401, 'NAO_AUTENTICADO');
    assert.equal(problema.type, 'https://recreio.app/problemas/nao-autenticado');
    assert.equal(problema.instance, '/api/v1/eu');
  });

  test('cookie inválido responde 401 NAO_AUTENTICADO', async () => {
    const res = await fetch(`${server.baseUrl}/api/v1/eu`, comCookie('recreio.session_token=forjado.assinatura'));
    await lerProblema(res, 401, 'NAO_AUTENTICADO');
  });

  test('com sessão devolve a pessoa e os vínculos agrupados por escola', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.responsavel);
    const res = await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(cookie));
    assert.equal(res.status, 200);
    const eu = euSchema.parse(await res.json());
    assert.equal(eu.usuario.nome, 'Fernanda Lima');
    assert.equal(eu.usuario.email, EMAILS.responsavel);
    assert.equal(eu.usuario.emailVerificado, true);
    assert.deepEqual(eu.escolas, [{ slug: ESCOLA, nome: 'Colégio Recreio', perfis: ['responsavel'] }]);
  });

  test('o vínculo vale só na escola dele: outra escola responde 403 SEM_ACESSO', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.responsavel);
    const res = await fetch(`${server.baseUrl}${rotaDaEscola('/alunos', ESCOLA_SEM_VINCULO)}`, comCookie(cookie));
    await lerProblema(res, 403, 'SEM_ACESSO');
  });
});

describe('permissões por perfil', () => {
  const server = useServer(() => createApp(container));

  test('/escolas/:escola/publica responde sem login', async () => {
    const res = await fetch(`${server.baseUrl}${rotaDaEscola('/publica')}`);
    assert.equal(res.status, 200);
    assert.deepEqual(escolaPublicaSchema.parse(await res.json()), {
      slug: ESCOLA,
      nome: 'Colégio Recreio',
      cidade: 'Fortaleza',
      corMarca: '#0067CC',
    });
  });

  test('alunos e dados completos da escola sem sessão respondem 401', async () => {
    for (const caminho of [rotaDaEscola('/alunos'), rotaDaEscola()]) {
      await lerProblema(await fetch(`${server.baseUrl}${caminho}`), 401, 'NAO_AUTENTICADO');
    }
  });

  test('portaria não tem alunos:ver e recebe 403 PERMISSAO_NEGADA', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.portaria);
    const problema = await lerProblema(
      await fetch(`${server.baseUrl}${rotaDaEscola('/alunos')}`, comCookie(cookie)),
      403,
      'PERMISSAO_NEGADA',
    );
    assert.equal(problema.detail, 'Os perfis da conta não têm a ação "ver" no módulo "alunos".');
  });

  test('responsável vê /eu e a escola pública, mas não a lista de alunos nem o painel', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.responsavel);
    assert.equal((await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(cookie))).status, 200);
    assert.equal((await fetch(`${server.baseUrl}${rotaDaEscola('/publica')}`, comCookie(cookie))).status, 200);
    for (const caminho of [rotaDaEscola('/alunos'), rotaDaEscola()]) {
      await lerProblema(await fetch(`${server.baseUrl}${caminho}`, comCookie(cookie)), 403, 'PERMISSAO_NEGADA');
    }
  });

  test('direção vê alunos e o painel da escola', async () => {
    const cookie = await entrar(server.baseUrl, EMAILS.direcao);
    assert.equal((await fetch(`${server.baseUrl}${rotaDaEscola('/alunos')}`, comCookie(cookie))).status, 200);
    assert.equal((await fetch(`${server.baseUrl}${rotaDaEscola()}`, comCookie(cookie))).status, 200);
  });
});

describe('troca de senha', () => {
  const server = useServer(() => createApp(container));
  const email = 'paulo.ribeiro@colegiorecreio.test';
  const senhaNova = 'senha-trocada-2026';

  test('o link do e-mail leva à tela do portal e troca a senha uma vez', async () => {
    const sessaoAntiga = await entrar(server.baseUrl, email);
    const pedido = await postarAuth(server.baseUrl, '/request-password-reset', { email });
    assert.equal(pedido.status, 200);

    const link = linkDoEmail(caixa, email);
    assert.equal(link.origin, ORIGEM_DE_TESTE);
    assert.equal(link.pathname, '/redefinir-senha');
    const token = link.searchParams.get('token');
    assert.ok(token);

    const troca = await postarAuth(server.baseUrl, '/reset-password', { token, newPassword: senhaNova });
    assert.equal(troca.status, 200);

    await entrar(server.baseUrl, email, senhaNova);
    const antiga = await postarAuth(server.baseUrl, '/sign-in/email', { email, password: SENHA_DE_TESTE });
    assert.equal(antiga.status, 401);
    await lerProblema(await fetch(`${server.baseUrl}/api/v1/eu`, comCookie(sessaoAntiga)), 401, 'NAO_AUTENTICADO');

    const deNovo = await postarAuth(server.baseUrl, '/reset-password', { token, newPassword: 'outra-senha-2026' });
    assert.equal(deNovo.status, 400);
  });

  test('Origin fora da lista não muda o endereço do link', async () => {
    const res = await fetch(`${server.baseUrl}/api/auth/request-password-reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://golpe.example' },
      body: JSON.stringify({ email: EMAILS.portaria }),
    });
    assert.equal(res.status, 200);
    assert.equal(linkDoEmail(caixa, EMAILS.portaria).origin, ORIGEM_DE_TESTE);
  });
});

describe('limite de tentativas de entrada', () => {
  const server = useServer(() => createApp(container, { limiteDeEntradaPorMinuto: 2 }));

  test('a 3ª tentativa no minuto recebe 429 LIMITE_EXCEDIDO', async () => {
    for (let tentativa = 0; tentativa < 2; tentativa++) {
      const res = await postarAuth(server.baseUrl, '/sign-in/email', {
        email: EMAILS.direcao,
        password: 'errada-123456',
      });
      assert.equal(res.status, 401);
    }
    const res = await postarAuth(server.baseUrl, '/sign-in/email', { email: EMAILS.direcao, password: SENHA_DE_TESTE });
    await lerProblema(res, 429, 'LIMITE_EXCEDIDO');
    assert.match(res.headers.get('retry-after') ?? '', /^\d+$/);
  });

  test('ler a sessão fica fora do limite', async () => {
    for (let vez = 0; vez < 3; vez++) {
      const res = await fetch(`${server.baseUrl}/api/auth/get-session`);
      assert.equal(res.status, 200);
    }
  });
});

describe('cookie em produção', () => {
  let seguro: Container;
  const server = useServer(() => {
    const teste = configDeTeste(banco.urlApp);
    seguro = createContainer({
      ...teste.config,
      autenticacao: { ...teste.config.autenticacao, cookieSeguro: true },
    });
    return createApp(seguro);
  });

  after(async () => {
    await seguro?.encerrar();
  });

  test('o cookie leva Secure e o prefixo __Secure-', async () => {
    const res = await postarAuth(server.baseUrl, '/sign-in/email', { email: EMAILS.direcao, password: SENHA_DE_TESTE });
    assert.equal(res.status, 200);
    const sessao = res.headers.getSetCookie().find((cookie) => cookie.startsWith('__Secure-recreio.session_token='));
    assert.ok(sessao, 'esperava __Secure-recreio.session_token');
    assert.match(sessao, /;\s*Secure/i);
    assert.match(sessao, /HttpOnly/i);
  });
});
