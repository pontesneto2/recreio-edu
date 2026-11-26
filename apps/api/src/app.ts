import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { pinoHttp } from 'pino-http';
import { env } from './config/env.ts';
import type { Container } from './container.ts';
import { createAlunosRouter } from './modules/alunos/alunos.routes.ts';
import { createEscolaRouter } from './modules/escola/escola.routes.ts';
import { errorHandler, notFoundHandler } from './shared/http/error-handler.ts';
import { logger } from './shared/logger/logger.ts';

export const createApp = (container: Container) => {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet());
  app.use(cors({ origin: env.CORS_ORIGIN }));
  app.use(express.json({ limit: '1mb' }));
  app.use(pinoHttp({ logger }));

  app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', uptime: process.uptime() });
  });
  app.use('/api/escola', createEscolaRouter(container.escolaService));
  app.use('/api/alunos', createAlunosRouter(container.alunosService));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
};
