import { randomUUID } from 'node:crypto';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { ATRIBUTO, anotarRequisicao } from '../observability/span.ts';

export const REQUEST_ID_HEADER = 'X-Request-Id';

/** Até 128 caracteres de um conjunto que não quebra log nem cabeçalho. */
const SAFE_REQUEST_ID = /^[A-Za-z0-9._:-]{1,128}$/;

/** Usa o `X-Request-Id` do cliente quando ele é seguro; senão gera um UUID. */
export const resolveRequestId = (incoming: string | string[] | undefined): string =>
  typeof incoming === 'string' && SAFE_REQUEST_ID.test(incoming) ? incoming : randomUUID();

/** `genReqId` do pino-http: define o id da requisição, devolve o mesmo valor na resposta e grava no span. */
export const genRequestId = (req: IncomingMessage, res: ServerResponse): string => {
  const id = resolveRequestId(req.headers['x-request-id']);
  res.setHeader(REQUEST_ID_HEADER, id);
  anotarRequisicao({ [ATRIBUTO.requestId]: id });
  return id;
};
