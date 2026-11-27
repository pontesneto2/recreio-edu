import type { RequestHandler } from 'express';
import { rateLimit, type Store } from 'express-rate-limit';
import type { Redis } from 'ioredis';
import { RedisStore, type RedisReply } from 'rate-limit-redis';
import { TooManyRequestsError } from '../errors/app-error.ts';

/** Contador no Redis, compartilhado entre as instâncias da API. Uma loja por limitador. */
export const createRedisRateLimitStore = (redis: Redis, prefixo = 'recreio:limite:'): Store =>
  new RedisStore({
    prefix: prefixo,
    sendCommand: (comando: string, ...args: string[]) => redis.call(comando, ...args) as Promise<RedisReply>,
  });

/**
 * Limite por IP numa janela de 1 minuto, com os cabeçalhos `RateLimit` e `RateLimit-Policy` do draft 8 da IETF.
 * A biblioteca define `Retry-After`. O tratador de erros escreve o corpo `LIMITE_EXCEDIDO`.
 * Sem `store`, o contador fica na memória do processo. Com o Redis fora, a requisição passa sem contar.
 */
export const createRateLimit = (limitPerMinute: number, store?: Store): RequestHandler =>
  rateLimit({
    windowMs: 60_000,
    limit: limitPerMinute,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    store,
    passOnStoreError: true,
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError(
          `Limite de ${limitPerMinute} requisições por minuto excedido. Tente de novo após o tempo de Retry-After.`,
        ),
      );
    },
  });
