import type { Escola } from '@recreio/contracts';
import type { EscolaRepository } from './escola.repository.ts';

export type EscolaService = {
  obter: () => Promise<Escola>;
};

export const createEscolaService = (repository: EscolaRepository): EscolaService => ({
  obter: () => repository.get(),
});
