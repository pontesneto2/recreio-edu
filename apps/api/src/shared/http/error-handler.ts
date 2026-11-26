import type { ErrorRequestHandler, RequestHandler } from 'express';
import { AppError, NotFoundError } from '../errors/app-error.ts';

export const notFoundHandler: RequestHandler = (req) => {
  throw new NotFoundError(`Rota ${req.method} ${req.path} não encontrada.`);
};

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ erro: { codigo: err.code, mensagem: err.message, detalhes: err.details } });
    return;
  }
  req.log.error({ err }, 'erro não tratado');
  res.status(500).json({ erro: { codigo: 'ERRO_INTERNO', mensagem: 'Erro interno. Tente de novo em instantes.' } });
};
