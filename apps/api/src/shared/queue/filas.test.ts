import { Queue, type Job, type Worker } from 'bullmq';
import type { Redis } from 'ioredis';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { after, before, describe, test } from 'node:test';
import { iniciarRedisDeTeste, type RedisDeTeste } from '../../test/redis.ts';
import type { EnvioEmail } from '../email/enviador.ts';
import { createProcessadorEmail } from '../email/processar-email.ts';
import { createRedis, encerrarRedis } from '../redis/redis.ts';
import { createConsumidor } from './consumidor.ts';
import { createEnfileirador, type Enfileirador } from './enfileirador.ts';
import { filas, idDoJob, PREFIXO_FILAS } from './filas.ts';

const emailTeste = (para: string) => ({ modelo: 'teste' as const, para, variaveis: { origem: 'teste' } });

describe('idDoJob', () => {
  test('a mesma chave gera o mesmo id, e chaves diferentes geram ids diferentes', () => {
    assert.equal(idDoJob('emails', ['boas-vindas', 'u1']), idDoJob('emails', ['boas-vindas', 'u1']));
    assert.notEqual(idDoJob('emails', ['boas-vindas', 'u1']), idDoJob('emails', ['boas-vindas', 'u2']));
    // Partes concatenadas não colidem: ['a', 'bc'] e ['ab', 'c'] são chaves diferentes.
    assert.notEqual(idDoJob('emails', ['a', 'bc']), idDoJob('emails', ['ab', 'c']));
  });

  test('o id não tem dois-pontos nem o texto da chave', () => {
    const id = idDoJob('emails', ['boas-vindas', 'fernanda@exemplo.com']);
    assert.match(id, /^emails-[0-9a-f]{40}$/);
  });

  test('recusa chave vazia', () => {
    assert.throws(() => idDoJob('emails', []));
    assert.throws(() => idDoJob('emails', ['boas-vindas', '']));
  });
});

describe('definição da fila emails', () => {
  test('5 tentativas com espera exponencial e retenção de concluídas e falhas', () => {
    assert.deepEqual(filas.emails.opcoes, {
      attempts: 5,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: { age: 7 * 24 * 3600 },
      removeOnFail: { age: 30 * 24 * 3600 },
    });
  });
});

describe('filas com Redis', () => {
  let servidor: RedisDeTeste;
  let produtor: Redis;
  let consumidor: Redis;
  let enfileirador: Enfileirador;

  before(async () => {
    servidor = await iniciarRedisDeTeste();
    produtor = createRedis(servidor.url, 'api');
    consumidor = createRedis(servidor.url, 'worker');
    enfileirador = createEnfileirador(produtor);
  });

  after(async () => {
    await enfileirador?.encerrar();
    await Promise.all([produtor && encerrarRedis(produtor), consumidor && encerrarRedis(consumidor)]);
    await servidor?.parar();
  });

  test('enfileirar sem Redis rejeita', async () => {
    await assert.rejects(
      createEnfileirador(undefined).enfileirar('emails', emailTeste('a@exemplo.com'), ['x']),
      /REDIS_URL/,
    );
  });

  test('enfileirar valida os dados antes de chegar ao Redis', async () => {
    await assert.rejects(enfileirador.enfileirar('emails', emailTeste('nao-e-email'), ['invalido']));
  });

  test('a mesma chave enfileira uma vez só', async () => {
    const primeiro = await enfileirador.enfileirar('emails', emailTeste('a@exemplo.com'), ['duplicado']);
    const segundo = await enfileirador.enfileirar('emails', emailTeste('b@exemplo.com'), ['duplicado']);
    assert.equal(primeiro, segundo);

    const fila = new Queue('emails', { connection: produtor, prefix: PREFIXO_FILAS });
    try {
      const job = await fila.getJob(primeiro);
      assert.equal(job?.data.para, 'a@exemplo.com', 'a 2ª inclusão não troca os dados');
      assert.equal(job?.opts.attempts, 5);
      await fila.obliterate({ force: true });
    } finally {
      await fila.close();
    }
  });

  test('o worker envia o e-mail com o id da tarefa no Message-ID', async () => {
    const enviados: EnvioEmail[] = [];
    const worker = createConsumidor(
      'emails',
      createProcessadorEmail({ enviar: async (envio) => void enviados.push(envio), encerrar: () => undefined }),
      { conexao: consumidor, concorrencia: 1 },
    );
    try {
      const concluido = once(worker, 'completed') as Promise<[Job]>;
      const jobId = await enfileirador.enfileirar('emails', emailTeste('fernanda@exemplo.com'), ['envio']);
      const [job] = await concluido;

      assert.equal(job.id, jobId);
      assert.equal(enviados.length, 1);
      assert.equal(enviados[0]?.para, 'fernanda@exemplo.com');
      assert.equal(enviados[0]?.id, jobId);
      assert.equal(enviados[0]?.assunto, 'E-mail de teste do Recreio');
    } finally {
      await worker.close();
    }
  });

  describe('falhas', () => {
    let worker: Worker | undefined;
    let fila: Queue;

    before(() => {
      fila = new Queue('emails', { connection: produtor, prefix: PREFIXO_FILAS });
    });
    after(async () => {
      await worker?.close();
      await fila.close();
    });

    test('erro comum gera nova tentativa; dado inválido falha de vez', async () => {
      let chamadas = 0;
      worker = createConsumidor(
        'emails',
        async () => {
          chamadas += 1;
          if (chamadas === 1) throw new Error('SMTP fora do ar');
        },
        { conexao: consumidor, concorrencia: 1 },
      );

      // Espera curta para o teste não esperar os 10 s da fila real.
      const concluido = once(worker, 'completed') as Promise<[Job]>;
      await fila.add('emails', emailTeste('a@exemplo.com'), {
        jobId: 'retentativa',
        attempts: 3,
        backoff: { type: 'exponential', delay: 50 },
      });
      const [job] = await concluido;
      assert.equal(job.id, 'retentativa');
      assert.equal(chamadas, 2);
      assert.equal(job.attemptsMade, 2);

      const falhou = once(worker, 'failed') as Promise<[Job, Error]>;
      await fila.add('emails', { modelo: 'teste', para: 'sem-arroba' }, { jobId: 'invalido', attempts: 5 });
      const [jobInvalido, erro] = await falhou;
      assert.equal(jobInvalido.attemptsMade, 1, 'dado inválido não tem nova tentativa');
      assert.match(erro.message, /Dados inválidos/);
      assert.equal(await jobInvalido.getState(), 'failed');
    });
  });
});
