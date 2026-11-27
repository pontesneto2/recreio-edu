import { RedisContainer } from '@testcontainers/redis';

export type RedisDeTeste = { url: string; parar: () => Promise<void> };

/** Sobe um Redis 8 descartável, a mesma imagem do docker-compose.yml. */
export const iniciarRedisDeTeste = async (): Promise<RedisDeTeste> => {
  const container = await new RedisContainer('redis:8-alpine').start();
  return {
    url: container.getConnectionUrl(),
    parar: async () => {
      await container.stop();
    },
  };
};
