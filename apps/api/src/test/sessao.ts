import assert from 'node:assert/strict';
import { type ContainerConfig } from '../container.ts';
import type { EmailJob } from '../shared/email/email-job.ts';
import type { Enfileirador } from '../shared/queue/enfileirador.ts';

/** Senha das contas do seed nos testes. */
export const SENHA_DE_TESTE = 'senha-de-teste-2026';

/** Origem do portal nos testes. O Better Auth confere o `Origin` das requisições com cookie. */
export const ORIGEM_DE_TESTE = 'http://portal.test';

/** Slug do Colégio Recreio do seed. */
export const ESCOLA = 'colegio-recreio';

/** Caminho de uma rota da escola na v1: `/api/v1/escolas/colegio-recreio/alunos`. */
export const rotaDaEscola = (caminho = '', escola = ESCOLA) => `/api/v1/escolas/${escola}${caminho}`;

export const EMAILS = {
  responsavel: 'fernanda.lima@colegiorecreio.test',
  portaria: 'francisco.araujo@colegiorecreio.test',
  direcao: 'lucia.menezes@colegiorecreio.test',
} as const;

/** Filas que guardam os e-mails em memória, para os testes lerem o link enviado. */
export const createFilasEmMemoria = () => {
  const caixa: EmailJob[] = [];
  const filas: Enfileirador = {
    enfileirar: async (_fila, dados, chave) => {
      caixa.push(dados);
      return chave.join('|');
    },
    encerrar: async () => undefined,
  };
  return { filas, caixa };
};

/** Config do container dos testes: e-mails em memória e origem de teste confiável. */
export const configDeTeste = (databaseUrl: string) => {
  const { filas, caixa } = createFilasEmMemoria();
  const config: ContainerConfig = {
    databaseUrl,
    filas,
    autenticacao: { url: ORIGEM_DE_TESTE, origensConfiaveis: [ORIGEM_DE_TESTE] },
  };
  return { config, caixa };
};

/** Cabeçalho `Cookie` com os cookies que a resposta definiu. */
export const cookieDaResposta = (res: Response) =>
  res.headers
    .getSetCookie()
    .map((cookie) => cookie.split(';')[0])
    .join('; ');

/** POST JSON numa rota do Better Auth, com o `Origin` do portal. */
export const postarAuth = (baseUrl: string, caminho: string, corpo: unknown, cookie?: string) =>
  fetch(`${baseUrl}/api/auth${caminho}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: ORIGEM_DE_TESTE, ...(cookie ? { Cookie: cookie } : {}) },
    body: JSON.stringify(corpo),
  });

/** Entra com e-mail e senha e devolve o cabeçalho `Cookie` da sessão. */
export const entrar = async (baseUrl: string, email: string, senha = SENHA_DE_TESTE): Promise<string> => {
  const res = await postarAuth(baseUrl, '/sign-in/email', { email, password: senha });
  assert.equal(res.status, 200, `entrar como ${email}`);
  const cookie = cookieDaResposta(res);
  assert.match(cookie, /recreio\.session_token=/);
  return cookie;
};
