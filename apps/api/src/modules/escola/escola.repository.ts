import type { Escola } from '@recreio/contracts';

export type EscolaRepository = {
  get: () => Promise<Escola>;
};

export const createInMemoryEscolaRepository = (seed: Escola): EscolaRepository => ({
  get: async () => seed,
});
