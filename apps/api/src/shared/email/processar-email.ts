import type { Processador } from '../queue/consumidor.ts';
import type { EnviadorEmail } from './enviador.ts';
import { renderizarEmail } from './modelos.ts';

/** Processador da fila `emails`: monta a mensagem do modelo e envia. */
export const createProcessadorEmail =
  (enviador: EnviadorEmail): Processador<'emails'> =>
  async (dados, job) => {
    const mensagem = renderizarEmail(dados);
    await enviador.enviar({ ...mensagem, para: dados.para, id: job.id ?? job.name });
  };
