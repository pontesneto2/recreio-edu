import type { GrupoDeNavegacao } from './tipos.ts';

/** Rota que encerra a sessão. Vale no menu lateral, no "Mais" do celular e no seletor de perfil. */
export const ROTA_SAIR = '/sair';

/** Grupo que aparece no fim do menu de todos os perfis. */
export const GRUPO_CONTA: GrupoDeNavegacao = {
  label: 'Conta',
  items: [
    { id: 'prefs', label: 'Acessibilidade', icon: 'accessibility', href: '/preferencias' },
    { id: 'trocar-perfil', label: 'Trocar perfil', icon: 'users', href: '/' },
    { id: 'sair', label: 'Sair', icon: 'logout', href: ROTA_SAIR },
  ],
};
