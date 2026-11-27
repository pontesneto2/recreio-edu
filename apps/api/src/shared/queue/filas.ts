import type { JobsOptions } from 'bullmq';
import { createHash } from 'node:crypto';
import type { z } from 'zod';
import { emailJobSchema } from '../email/email-job.ts';

/** Prefixo das chaves do BullMQ no Redis. */
export const PREFIXO_FILAS = 'recreio';

const HORA_EM_SEGUNDOS = 3_600;
const DIA_EM_SEGUNDOS = 24 * HORA_EM_SEGUNDOS;

export type DefinicaoFila<S extends z.ZodType = z.ZodType> = {
  nome: string;
  /** Schema dos dados. O produtor valida antes de enfileirar e o worker valida de novo ao processar. */
  dados: S;
  /** Padrões de toda tarefa da fila: tentativas, espera exponencial e retenção. */
  opcoes: JobsOptions;
};

type ConfigFila<S extends z.ZodType> = {
  nome: string;
  dados: S;
  /** Total de execuções, contando a primeira. */
  tentativas: number;
  /** Espera antes da 2ª execução. Dobra a cada falha: 10 s, 20 s, 40 s... */
  esperaInicialMs: number;
};

const definirFila = <S extends z.ZodType>({
  nome,
  dados,
  tentativas,
  esperaInicialMs,
}: ConfigFila<S>): DefinicaoFila<S> => ({
  nome,
  dados,
  opcoes: {
    attempts: tentativas,
    backoff: { type: 'exponential', delay: esperaInicialMs },
    // Concluídas ficam 7 dias. Enquanto existem, o mesmo id não roda de novo.
    removeOnComplete: { age: 7 * DIA_EM_SEGUNDOS },
    // Falhas ficam 30 dias para investigação e reprocessamento manual.
    removeOnFail: { age: 30 * DIA_EM_SEGUNDOS },
  },
});

/** Filas da aplicação. Uma fila nova entra aqui e ganha um consumidor em `worker.ts`. */
export const filas = {
  emails: definirFila({ nome: 'emails', dados: emailJobSchema, tentativas: 5, esperaInicialMs: 10_000 }),
} as const;

export type NomeFila = keyof typeof filas;
export type DadosDaFila<N extends NomeFila> = z.output<(typeof filas)[N]['dados']>;

/**
 * Id determinístico da tarefa: hash da fila e da chave de negócio.
 * A mesma chave gera o mesmo id, e o BullMQ ignora a 2ª inclusão enquanto a 1ª existir.
 * O hash evita `:` (proibido em id do BullMQ) e dado pessoal no Redis.
 */
export const idDoJob = (fila: NomeFila, chave: readonly string[]): string => {
  if (chave.length === 0 || chave.some((parte) => parte.length === 0)) {
    throw new Error('A chave da tarefa precisa de ao menos uma parte, sem partes vazias.');
  }
  const hash = createHash('sha256')
    .update(JSON.stringify([fila, ...chave]))
    .digest('hex');
  return `${fila}-${hash.slice(0, 40)}`;
};
