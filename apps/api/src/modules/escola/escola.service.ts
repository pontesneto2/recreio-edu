import type { Escola, EscolaPublica } from '@recreio/contracts';
import { NotFoundError } from '../../shared/errors/app-error.ts';
import type { EscolaContexto } from '../../shared/tenant/escola-contexto.ts';
import type { EscolaRepository } from './escola.repository.ts';

/** As escolas atendidas hoje ficam no Ceará. O fuso vira coluna de `escolas` quando surgir outro. */
const FUSO_HORARIO = 'America/Fortaleza';

/** Data no formato AAAA-MM-DD no fuso da escola. */
export const dataNoFuso = (instante: Date, fuso = FUSO_HORARIO): string =>
  new Intl.DateTimeFormat('en-CA', { timeZone: fuso, year: 'numeric', month: '2-digit', day: '2-digit' }).format(
    instante,
  );

export type EscolaService = {
  obter: (contexto: EscolaContexto) => Promise<Escola>;
  /** Nome, cidade e cor da marca, para a tela de entrada. */
  obterPublica: (contexto: EscolaContexto) => Promise<EscolaPublica>;
};

export const createEscolaService = (
  repository: EscolaRepository,
  agora: () => Date = () => new Date(),
): EscolaService => ({
  obter: async (contexto) => {
    const escola = await repository.get(contexto);
    if (!escola) throw new NotFoundError('Escola não encontrada.');
    return { ...escola, hoje: dataNoFuso(agora()) };
  },
  obterPublica: async (contexto) => {
    const escola = await repository.getPublica(contexto);
    if (!escola) throw new NotFoundError('Escola não encontrada.');
    return escola;
  },
});
