import type { Eu, EscolaDoUsuario, PerfilDeVinculo } from '@recreio/contracts';
import { PERFIS, type Perfil } from '../config/navigation/index.ts';

/** Casca do portal de cada perfil de vínculo. Os 5 perfis da equipe da escola dividem a casca `escola`. */
export const CASCA_DO_VINCULO: Record<PerfilDeVinculo, Perfil> = {
  responsavel: 'familia',
  aluno: 'aluno',
  professor: 'professor',
  secretaria: 'escola',
  financeiro: 'escola',
  portaria: 'escola',
  coordenacao: 'escola',
  direcao: 'escola',
};

/** Cascas liberadas para os perfis, sem repetir, na ordem da tela de escolha. */
export const cascasDosPerfis = (perfis: readonly PerfilDeVinculo[]): Perfil[] => {
  const liberadas = new Set(perfis.map((perfil) => CASCA_DO_VINCULO[perfil]));
  return PERFIS.filter((perfil) => liberadas.has(perfil));
};

/** Vínculo da conta com a escola do slug, ou `undefined` sem vínculo. */
export const escolaDaConta = (eu: Eu, slug: string): EscolaDoUsuario | undefined =>
  eu.escolas.find((escola) => escola.slug === slug);
