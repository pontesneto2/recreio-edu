import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.ts';
import type { Container } from './container.ts';
import { createAlunosRouter } from './modules/alunos/alunos.routes.ts';
import { createEuRouter } from './modules/autenticacao/eu.routes.ts';
import { createEscolaRouter } from './modules/escola/escola.routes.ts';
import { openApiDocument } from './openapi.ts';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.ts';
import { camposDoLog, ignorarNoLog } from './shared/http/log-http.ts';
import { createRateLimit, createRedisRateLimitStore } from './shared/http/rate-limit.ts';
import { createReadyHandler } from './shared/http/ready.ts';
import { genRequestId, REQUEST_ID_HEADER } from './shared/http/request-id.ts';
import { logger } from './shared/logger/logger.ts';
import { createApiReferenceRouter } from './shared/openapi/api-reference.ts';
import { API_V1_PREFIX } from './shared/openapi/document.ts';

export type AppOptions = {
  /** Requisições por minuto por IP em `/api/v1`. `false` desliga o limite. */
  rateLimitPerMinute?: number | false;
  /** Tentativas por minuto por IP em entrar, cadastrar e trocar senha. `false` desliga o limite. */
  limiteDeEntradaPorMinuto?: number | false;
};

/** Rotas do Better Auth que recebem senha ou disparam e-mail. Ficam sob o limite de tentativas. */
const ROTAS_DE_ENTRADA = [
  '/api/auth/sign-in/email',
  '/api/auth/sign-up/email',
  '/api/auth/request-password-reset',
  '/api/auth/reset-password',
  '/api/auth/send-verification-email',
];

const defaultRateLimit = () => (env.NODE_ENV === 'test' ? false : env.RATE_LIMIT_PER_MINUTE);
const defaultLimiteDeEntrada = () => (env.NODE_ENV === 'test' ? false : env.AUTH_RATE_LIMIT_PER_MINUTE);

export const createApp = (
  container: Container,
  { rateLimitPerMinute = defaultRateLimit(), limiteDeEntradaPorMinuto = defaultLimiteDeEntrada() }: AppOptions = {},
) => {
  const app = express();

  app.disable('x-powered-by');
  // Proxies confiáveis para req.ip e o limite por IP. Valor de produção em docs/operacao/README.md.
  app.set('trust proxy', env.TRUST_PROXY);
  app.use(
    pinoHttp({ logger, genReqId: genRequestId, customProps: camposDoLog, autoLogging: { ignore: ignorarNoLog } }),
  );
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      exposedHeaders: [REQUEST_ID_HEADER, 'Retry-After', 'RateLimit', 'RateLimit-Policy'],
    }),
  );
  // Better Auth (ADR 0007) lê o corpo cru, então fica antes do express.json.
  if (limiteDeEntradaPorMinuto !== false) app.post(ROTAS_DE_ENTRADA, createRateLimit(limiteDeEntradaPorMinuto));
  app.all('/api/auth/*splat', container.autenticacao.handler);
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  app.get('/api/ready', createReadyHandler({ postgres: container.verificarBanco, redis: container.verificarRedis }));
  app.use('/api/docs', createApiReferenceRouter(`${API_V1_PREFIX}/openapi.json`));

  const v1 = express.Router();
  if (rateLimitPerMinute !== false) {
    const store = container.redis ? createRedisRateLimitStore(container.redis) : undefined;
    v1.use(createRateLimit(rateLimitPerMinute, store));
  }
  v1.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  const { acesso, repositorio } = container.autenticacao;
  v1.use('/eu', createEuRouter(repositorio, acesso));
  // Rotas da escola: o slug da rota define a escola (ADR 0011). Slug desconhecido responde 404.
  // Cada router declara a própria proteção com acesso.exigirSessao ou acesso.exigirPermissao.
  const daEscola = express.Router({ mergeParams: true });
  daEscola.use(container.resolverEscola);
  daEscola.use('/alunos', createAlunosRouter(container.alunosService, acesso));
  daEscola.use('/', createEscolaRouter(container.escolaService, acesso));
  v1.use('/escolas/:escola', daEscola);
  app.use(API_V1_PREFIX, v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
