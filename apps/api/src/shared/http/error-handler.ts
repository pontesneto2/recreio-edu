import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors/app-error.ts';
import { createProblem, requestInstance, sendProblem } from './problem.ts';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Rota ${req.method} ${req.path} não encontrada.`);
};

/** Erro que o `express.json()` lança quando o corpo não é JSON válido. */
const isJsonParseError = (err: unknown) =>
  err instanceof SyntaxError && 'type' in err && err.type === 'entity.parse.failed';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const instance = requestInstance(req);

  if (err instanceof AppError) {
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

  req.log.error({ err }, 'erro não tratado');
  sendProblem(res, createProblem('ERRO_INTERNO', { detail: 'Erro interno. Tente de novo em instantes.', instance }));
};
