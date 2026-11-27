import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import type { Database } from '../../database/client.ts';
import { account, session, user, verification } from '../../database/schema/index.ts';
import { logger } from '../../shared/logger/logger.ts';
import type { Enfileirador } from '../../shared/queue/enfileirador.ts';
import { PREFIXO_DO_COOKIE } from '../../shared/sessao/cookie.ts';
import { origemDoLink } from './origens.ts';

export const SENHA_MINIMA = 10;

const TROCA_DE_SENHA_SEGUNDOS = 30 * 60;
const CONFIRMACAO_SEGUNDOS = 24 * 60 * 60;
const DIA_SEGUNDOS = 24 * 60 * 60;

export type ConfigAutenticacao = {
  /** Segredo que assina cookies e tokens. */
  segredo: string;
  /** Origem do portal, usada nos links dos e-mails quando a requisição não traz uma confiável. */
  url: string;
  /** Origens aceitas pelo Better Auth. Aceita `https://*.recreio.app`. */
  origensConfiaveis: string[];
  /** Cookie só por HTTPS (`Secure`). Liga em produção. */
  cookieSeguro: boolean;
  /** Cadastro pela própria pessoa. Desligado em produção até existir o convite da escola. */
  cadastroAberto: boolean;
};

/**
 * Better Auth com e-mail e senha (ADR 0007). As tabelas são globais e as consultas rodam
 * fora de `withEscola`. O acesso a uma escola vem dos vínculos, checados em `acesso.middleware.ts`.
 * Os e-mails saem pela fila `emails` (ADR 0009); o worker envia por SMTP.
 */
/** Primeiro nome para a saudação. Conta sem nome usa o começo do e-mail. */
const primeiroNome = ({ name, email }: { name: string; email: string }) =>
  name.trim().split(' ')[0] || email.split('@')[0] || email;

export const createAuth = (db: Database, filas: Enfileirador, config: ConfigAutenticacao) => {
  const link = (request: Request | undefined, caminho: string) =>
    `${origemDoLink(request, config.origensConfiaveis, config.url)}${caminho}`;

  return betterAuth({
    appName: 'Recreio',
    baseURL: config.url,
    basePath: '/api/auth',
    secret: config.segredo,
    trustedOrigins: config.origensConfiaveis,
    database: drizzleAdapter(db, { provider: 'pg', schema: { user, session, account, verification } }),
    emailAndPassword: {
      enabled: true,
      disableSignUp: !config.cadastroAberto,
      requireEmailVerification: true,
      minPasswordLength: SENHA_MINIMA,
      maxPasswordLength: 128,
      resetPasswordTokenExpiresIn: TROCA_DE_SENHA_SEGUNDOS,
      revokeSessionsOnPasswordReset: true,
      sendResetPassword: async ({ user: usuario, token }, request) => {
        const caminho = `/redefinir-senha?token=${encodeURIComponent(token)}`;
        await filas.enfileirar(
          'emails',
          {
            modelo: 'troca-de-senha',
            para: usuario.email,
            variaveis: { nome: primeiroNome(usuario), link: link(request, caminho) },
          },
          ['troca-de-senha', usuario.id, token],
        );
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      sendOnSignIn: true,
      autoSignInAfterVerification: true,
      expiresIn: CONFIRMACAO_SEGUNDOS,
      sendVerificationEmail: async ({ user: usuario, token }, request) => {
        const caminho = `/api/auth/verify-email?token=${encodeURIComponent(token)}&callbackURL=%2F`;
        await filas.enfileirar(
          'emails',
          {
            modelo: 'confirmacao-email',
            para: usuario.email,
            variaveis: { nome: primeiroNome(usuario), link: link(request, caminho) },
          },
          ['confirmacao-email', usuario.id, token],
        );
      },
    },
    session: { expiresIn: 7 * DIA_SEGUNDOS, updateAge: DIA_SEGUNDOS },
    // O limite de tentativas fica no Express (`app.ts`), com o IP de `req.ip` e o mesmo problem+json da API.
    rateLimit: { enabled: false },
    advanced: {
      cookiePrefix: PREFIXO_DO_COOKIE,
      useSecureCookies: config.cookieSeguro,
      defaultCookieAttributes: { httpOnly: true, sameSite: 'lax', secure: config.cookieSeguro },
    },
    telemetry: { enabled: false },
    logger: {
      level: 'warn',
      log: (nivel, mensagem, ...args) => logger[nivel]({ args }, `better-auth: ${mensagem}`),
    },
  });
};

export type Auth = ReturnType<typeof createAuth>;
