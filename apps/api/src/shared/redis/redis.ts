import { Redis, type RedisOptions } from 'ioredis';
import { logger } from '../logger/logger.ts';

export type Conexao = 'api' | 'worker';

/**
 * - `api`: com o Redis fora, o comando falha depois de 1 tentativa de reconexão. A requisição
 *   espera no máximo alguns segundos, e o limite de requisições deixa passar.
 * - `worker`: o BullMQ exige `maxRetriesPerRequest: null`, e o worker espera o Redis voltar.
 */
const OPCOES: Record<Conexao, RedisOptions> = {
  api: { maxRetriesPerRequest: 1, connectTimeout: 3_000 },
  worker: { maxRetriesPerRequest: null, connectTimeout: 5_000 },
};

/** Cliente ioredis com reconexão automática. O erro de conexão vai para o log uma vez por queda. */
export const createRedis = (url: string, conexao: Conexao): Redis => {
  const redis = new Redis(url, { ...OPCOES[conexao], connectionName: `recreio-${conexao}` });
  let avisado = false;
  redis.on('error', (err) => {
    if (avisado) return;
    avisado = true;
    logger.warn({ err, conexao }, 'Redis indisponível, tentando reconectar');
  });
  redis.on('ready', () => {
    if (avisado) logger.info({ conexao }, 'Redis reconectado');
    avisado = false;
  });
  return redis;
};

/** Roda `PING`. Rejeita quando o Redis não responde dentro de `timeoutMs`. */
export const pingRedis = async (redis: Redis, timeoutMs = 2_000): Promise<void> => {
  // Conexão caída responde na hora, sem esperar o timeout.
  if (['reconnecting', 'close', 'end'].includes(redis.status)) throw new Error(`Redis em estado ${redis.status}`);
  let timer: NodeJS.Timeout | undefined;
  const limite = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error(`Redis não respondeu em ${timeoutMs} ms`)), timeoutMs);
  });
  try {
    const resposta = await Promise.race([redis.ping(), limite]);
    if (resposta !== 'PONG') throw new Error(`PING devolveu ${String(resposta)}`);
  } finally {
    clearTimeout(timer);
  }
};

/** Fecha a conexão esperando os comandos em andamento. Sem conexão aberta, só desconecta. */
export const encerrarRedis = async (redis: Redis): Promise<void> => {
  if (redis.status === 'ready') {
    await redis.quit();
    return;
  }
  redis.disconnect();
};
