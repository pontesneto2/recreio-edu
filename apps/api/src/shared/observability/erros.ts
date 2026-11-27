import * as Sentry from '@sentry/node';

export type ContextoErro = {
  requestId?: string;
  escolaId?: string;
  /** Fila e id da tarefa, quando o erro vem do worker. */
  fila?: string;
  jobId?: string;
};

/**
 * Envia o erro ao Sentry com o contexto como tags. Sem `SENTRY_DSN`, o Sentry não é iniciado
 * em `instrumentation.ts` e a chamada não faz nada.
 */
export const reportarErro = (err: unknown, contexto: ContextoErro = {}): void => {
  if (!Sentry.isInitialized()) return;
  const tags = Object.fromEntries(Object.entries(contexto).filter(([, valor]) => valor !== undefined));
  Sentry.captureException(err, { tags });
};
