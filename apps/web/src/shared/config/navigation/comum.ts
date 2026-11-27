import type { GrupoDeNavegacao } from './tipos.ts';

/** Grupo que aparece no fim do menu de todos os perfis. */
export const GRUPO_CONTA: GrupoDeNavegacao = {
  label: 'Conta',
  items: [
    { id: 'prefs', label: 'Acessibilidade', icon: 'accessibility', href: '/preferencias' },
    // Até existir login, a troca de perfil volta para a tela de escolha.
    { id: 'trocar-perfil', label: 'Trocar perfil', icon: 'users', href: '/' },
  ],
};
