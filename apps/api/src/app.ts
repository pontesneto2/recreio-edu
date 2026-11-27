import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.ts';
import type { Container } from './container.ts';
import { createAlunosRouter } from './modules/alunos/alunos.routes.ts';
import { createEscolaRouter } from './modules/escola/escola.routes.ts';
import { openApiDocument } from './openapi.ts';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.ts';
import { createRateLimit } from './shared/http/rate-limit.ts';
import { genRequestId, REQUEST_ID_HEADER } from './shared/http/request-id.ts';
import { logger } from './shared/logger/logger.ts';
import { createApiReferenceRouter } from './shared/openapi/api-reference.ts';
import { API_V1_PREFIX } from './shared/openapi/document.ts';

export type AppOptions = {
  /** Requisições por minuto por IP em `/api/v1`. `false` desliga o limite. */
  rateLimitPerMinute?: number | false;
};

const defaultRateLimit = () => (env.NODE_ENV === 'test' ? false : env.RATE_LIMIT_PER_MINUTE);

export const createApp = (container: Container, { rateLimitPerMinute = defaultRateLimit() }: AppOptions = {}) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(pinoHttp({ logger, genReqId: genRequestId }));
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      exposedHeaders: [REQUEST_ID_HEADER, 'Retry-After', 'RateLimit', 'RateLimit-Policy'],
    }),
  );
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  app.get('/api/ready', async (req, res) => {
    try {
      await container.verificarBanco();
      res.json({ status: 'ok' });
    } catch (err) {
      req.log.warn({ err }, 'banco indisponível');
      res.status(503).json({ status: 'indisponivel' });
    }
  });
  app.use('/api/docs', createApiReferenceRouter(`${API_V1_PREFIX}/openapi.json`));

  const v1 = express.Router();
  if (rateLimitPerMinute !== false) v1.use(createRateLimit(rateLimitPerMinute));
  v1.get('/openapi.json', (_req, res) => {
    res.json(openApiDocument);
  });
  // Daqui em diante toda rota tem dados de escola. Host sem escola responde 404.
  v1.use(container.resolverEscola);
  v1.use('/escola', createEscolaRouter(container.escolaService));
  v1.use('/alunos', createAlunosRouter(container.alunosService));
  app.use(API_V1_PREFIX, v1);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
