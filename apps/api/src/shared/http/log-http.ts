import type { IncomingMessage, ServerResponse } from 'node:http';
import { escolaIdDaResposta } from '../tenant/resolver-escola.ts';

/** Rotas chamadas pelo healthcheck e pelo balanceador a cada poucos segundos. Ficam fora do log. */
const SEM_LOG = new Set(['/api/health', '/api/ready']);

/** `autoLogging.ignore` do pino-http. Compara só o caminho, sem a query. */
export const ignorarNoLog = (req: IncomingMessage): boolean => SEM_LOG.has((req.url ?? '').split('?')[0] ?? '');

/** `customProps` do pino-http. Na linha final da requisição, grava a escola resolvida. */
export const camposDoLog = (_req: IncomingMessage, res: ServerResponse): Record<string, string> => {
  const escolaId = escolaIdDaResposta(res as ServerResponse & { locals?: Record<string, unknown> });
  return escolaId ? { escolaId } : {};
};
