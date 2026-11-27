import { Queue } from 'bullmq';
import type { Redis } from 'ioredis';
import { type DadosDaFila, filas, idDoJob, type NomeFila, PREFIXO_FILAS } from './filas.ts';

export type Enfileirador = {
  /**
   * Valida os dados e põe a tarefa na fila. `chave` identifica o efeito no negócio
   * (`['boas-vindas', usuarioId]`) e vira o id da tarefa. Devolve esse id.
   */
  enfileirar: <N extends NomeFila>(fila: N, dados: DadosDaFila<N>, chave: readonly string[]) => Promise<string>;
  encerrar: () => Promise<void>;
};

/**
 * Produtor das filas, usado pela API. As filas abrem na primeira tarefa e
 * compartilham a conexão `redis`, que quem chama fecha depois de `encerrar`.
 * Sem Redis, `enfileirar` rejeita.
 */
export const createEnfileirador = (redis: Redis | undefined): Enfileirador => {
  const abertas = new Map<NomeFila, Queue>();

  const abrir = (fila: NomeFila, conexao: Redis) => {
    const existente = abertas.get(fila);
    if (existente) return existente;
    const definicao = filas[fila];
    const queue = new Queue(definicao.nome, {
      connection: conexao,
      prefix: PREFIXO_FILAS,
      defaultJobOptions: definicao.opcoes,
    });
    abertas.set(fila, queue);
    return queue;
  };

  return {
    enfileirar: async (fila, dados, chave) => {
      if (!redis) throw new Error(`Sem REDIS_URL: a tarefa da fila ${fila} não foi enfileirada.`);
      const validos: unknown = filas[fila].dados.parse(dados);
      const jobId = idDoJob(fila, chave);
      await abrir(fila, redis).add(fila, validos, { jobId });
      return jobId;
    },
    encerrar: async () => {
      await Promise.all([...abertas.values()].map((queue) => queue.close()));
      abertas.clear();
    },
  };
};
