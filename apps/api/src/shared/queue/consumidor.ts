import { type Job, UnrecoverableError, Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import { logger } from '../logger/logger.ts';
import { reportarErro } from '../observability/erros.ts';
import { type DadosDaFila, filas, type NomeFila, PREFIXO_FILAS } from './filas.ts';

/** Faz o trabalho de uma tarefa. Lançar erro agenda nova tentativa; `UnrecoverableError` falha de vez. */
export type Processador<N extends NomeFila> = (dados: DadosDaFila<N>, job: Job) => Promise<void>;

export type ConsumidorConfig = {
  /** Conexão com `maxRetriesPerRequest: null` (`createRedis(url, 'worker')`). */
  conexao: Redis;
  concorrencia: number;
};

/** Última tentativa: depois dela a tarefa fica na lista de falhas da fila. */
const esgotouTentativas = (job: Job) => job.attemptsMade >= (job.opts.attempts ?? 1);

/**
 * Worker do BullMQ para uma fila. Valida os dados com o schema da fila antes de processar:
 * dado inválido não melhora com nova tentativa, então falha de vez.
 */
export const createConsumidor = <N extends NomeFila>(
  fila: N,
  processador: Processador<N>,
  { conexao, concorrencia }: ConsumidorConfig,
): Worker => {
  const definicao = filas[fila];
  const log = logger.child({ fila });

  const worker = new Worker(
    definicao.nome,
    async (job) => {
      const dados = definicao.dados.safeParse(job.data);
      if (!dados.success) {
        throw new UnrecoverableError(`Dados inválidos na tarefa da fila ${fila}: ${dados.error.message}`);
      }
      await processador(dados.data as DadosDaFila<N>, job);
    },
    { connection: conexao, prefix: PREFIXO_FILAS, concurrency: concorrencia },
  );

  worker.on('completed', (job) => {
    log.info({ jobId: job.id, tentativa: job.attemptsMade }, 'tarefa concluída');
  });
  worker.on('failed', (job, err) => {
    if (!job) {
      log.error({ err }, 'tarefa falhou sem dados do job');
      return;
    }
    const final = esgotouTentativas(job) || err instanceof UnrecoverableError;
    const contexto = { jobId: job.id, tentativa: job.attemptsMade, tentativas: job.opts.attempts };
    if (!final) {
      log.warn({ err, ...contexto }, 'tarefa falhou, nova tentativa agendada');
      return;
    }
    log.error({ err, ...contexto }, 'tarefa falhou de vez e ficou na lista de falhas');
    reportarErro(err, { fila, jobId: job.id });
  });
  worker.on('error', (err) => {
    log.error({ err }, 'erro no worker da fila');
  });

  return worker;
};
