import { NAVEGACAO_ALUNO } from './aluno.ts';
import { NAVEGACAO_ESCOLA } from './escola.ts';
import { NAVEGACAO_FAMILIA } from './familia.ts';
import { NAVEGACAO_PROFESSOR } from './professor.ts';
import type { NavegacaoDoPerfil, Perfil } from './tipos.ts';

export type { GrupoDeNavegacao, ItemDeNavegacao, NavegacaoDoPerfil, Perfil } from './tipos.ts';

/** Menus por perfil, na ordem da tela de escolha. */
export const NAVEGACOES: Record<Perfil, NavegacaoDoPerfil> = {
  familia: NAVEGACAO_FAMILIA,
  aluno: NAVEGACAO_ALUNO,
  professor: NAVEGACAO_PROFESSOR,
  escola: NAVEGACAO_ESCOLA,
};

export const PERFIS = Object.keys(NAVEGACOES) as Perfil[];
