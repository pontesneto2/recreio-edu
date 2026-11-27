import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors/app-error.ts';
import { reportarErro } from '../observability/erros.ts';
import { escolaIdDaResposta } from '../tenant/resolver-escola.ts';
import { createProblem, requestInstance, sendProblem } from './problem.ts';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Rota ${req.method} ${req.path} não encontrada.`);
};

/** Erro que o `express.json()` lança quando o corpo não é JSON válido. */
const isJsonParseError = (err: unknown) =>
  err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed';

/** Erro que o `express.json()` lança quando o corpo passa de `limit`. Traz o limite em bytes. */
const bodyTooLargeLimit = (err: unknown): number | undefined => {
  if (!(err instanceof Error) || !('type' in err) || err.type !== 'entity.too.large') return undefined;
  return 'limit' in err && typeof err.limit === 'number' ? err.limit : 0;
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const instance = requestInstance(req);

  if (err instanceof AppError) {
    if (err.status >= 500) reportarErro(err, { requestId: String(req.id), escolaId: escolaIdDaResposta(res) });
    sendProblem(res, createProblem(err.code, { detail: err.message, instance, errors: err.errors }));
    return;
  }
  if (isJsonParseError(err)) {
    sendProblem(
      res,
      createProblem('DADOS_INVALIDOS', { detail: 'O corpo da requisição não é JSON válido.', instance }),
    );
    return;
  }
  const limit = bodyTooLargeLimit(err);
  if (limit !== undefined) {
    const detail = `O corpo da requisição passa do limite de ${Math.floor(limit / 1024)} KB.`;
    sendProblem(res, createProblem('CORPO_GRANDE_DEMAIS', { detail, instance }));
    return;
  }

  req.log.error({ err }, 'erro não tratado');
  reportarErro(err, { requestId: String(req.id), escolaId: escolaIdDaResposta(res) });
  sendProblem(res, createProblem('ERRO_INTERNO', { detail: 'Erro interno. Tente de novo em instantes.', instance }));
};
