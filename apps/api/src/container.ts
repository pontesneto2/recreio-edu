import { alunosSeed, escolaSeed } from './database/seed/escola.seed.ts';
import { createInMemoryAlunosRepository } from './modules/alunos/alunos.repository.ts';
import { type AlunosService, createAlunosService } from './modules/alunos/alunos.service.ts';
import { createInMemoryEscolaRepository } from './modules/escola/escola.repository.ts';
import { type EscolaService, createEscolaService } from './modules/escola/escola.service.ts';

/** Raiz de composição: liga cada repositório ao seu service. Os testes podem montar outro container. */
export type Container = {
  escolaService: EscolaService;
  alunosService: AlunosService;
};

export const createContainer = (): Container => ({
  escolaService: createEscolaService(createInMemoryEscolaRepository(escolaSeed)),
  alunosService: createAlunosService(createInMemoryAlunosRepository(alunosSeed)),
});
