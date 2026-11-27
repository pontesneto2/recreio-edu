import { env } from './config/env.ts';
import { createEnviadorEmail } from './shared/email/enviador.ts';
import { createProcessadorEmail } from './shared/email/processar-email.ts';
import { logger } from './shared/logger/logger.ts';
import { createConsumidor } from './shared/queue/consumidor.ts';
import { createRedis, encerrarRedis } from './shared/redis/redis.ts';

// Processo separado que consome as filas (ADR 0009). A API só enfileira.
if (!env.REDIS_URL) throw new Error('O worker precisa de REDIS_URL.');

const redis = createRedis(env.REDIS_URL, 'worker');
const enviadorEmail = createEnviadorEmail({ smtpUrl: env.SMTP_URL, remetente: env.EMAIL_FROM });
const config = { conexao: redis, concorrencia: env.WORKER_CONCURRENCY };

const consumidores = [createConsumidor('emails', createProcessadorEmail(enviadorEmail), config)];

logger.info({ filas: consumidores.map((consumidor) => consumidor.name) }, 'worker Recreio consumindo filas');

/** Para de pegar tarefas novas, espera as que estão rodando e fecha as conexões. */
const shutdown = async (signal: NodeJS.Signals) => {
  logger.info({ signal }, 'encerrando o worker');
  setTimeout(() => process.exit(1), 30_000).unref();
  await Promise.all(consumidores.map((consumidor) => consumidor.close()));
  enviadorEmail.encerrar();
  await encerrarRedis(redis);
  process.exit(0);
};

process.once('SIGINT', shutdown);
process.once('SIGTERM', shutdown);
