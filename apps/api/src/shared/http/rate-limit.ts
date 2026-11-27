import type { RequestHandler } from 'express';
import { rateLimit } from 'express-rate-limit';
import { TooManyRequestsError } from '../errors/app-error.ts';

/**
 * Limite por IP numa janela de 1 minuto, com os cabeçalhos `RateLimit` e `RateLimit-Policy` do draft 8 da IETF.
 * A biblioteca define `Retry-After`. O tratador de erros escreve o corpo `LIMITE_EXCEDIDO`.
 */
export const createRateLimit = (limitPerMinute: number): RequestHandler =>
  rateLimit({
    windowMs: 60_000,
    limit: limitPerMinute,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (_req, _res, next) => {
      next(
        new TooManyRequestsError(
          `Limite de ${limitPerMinute} requisições por minuto excedido. Tente de novo após o tempo de Retry-After.`,
        ),
      );
    },
  });
