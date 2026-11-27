import { createApp } from './app.ts';
import { env } from './config/env.ts';
import { createContainer } from './container.ts';
import { logger } from './shared/logger/logger.ts';

const container = createContainer();

const server = createApp(container).listen(env.PORT, () => {
  logger.info(`API Recreio em http://localhost:${env.PORT}`);
});

const shutdown = (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'encerrando a API');
  server.close(async () => {
    await container.encerrar();
    process.exit(0);
  });
  setTimeout(() => process.exit(1), 10_000).unref();
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
