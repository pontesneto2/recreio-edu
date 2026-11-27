// Enfileira um e-mail de teste na fila `emails`. Com o worker no ar, ele chega ao Mailpit.
//   npm run email:teste -w @recreio/api -- voce@exemplo.com
import { randomUUID } from 'node:crypto';
import { env } from '../config/env.ts';
import { createEnfileirador } from '../shared/queue/enfileirador.ts';
import { createRedis, encerrarRedis } from '../shared/redis/redis.ts';

const para = process.argv[2] ?? 'teste@recreio.localhost';
if (!env.REDIS_URL) throw new Error('Defina REDIS_URL para enfileirar.');

const redis = createRedis(env.REDIS_URL, 'worker');
const filas = createEnfileirador(redis);
try {
  // Cada execução usa uma chave nova. Repetir a mesma chave não enfileira de novo.
  const jobId = await filas.enfileirar(
    'emails',
    { modelo: 'teste', para, variaveis: { origem: 'npm run email:teste' } },
    ['teste', randomUUID()],
  );
  console.log(`Tarefa ${jobId} enfileirada para ${para}. Veja em http://localhost:8025.`);
} finally {
  await filas.encerrar();
  await encerrarRedis(redis);
}
