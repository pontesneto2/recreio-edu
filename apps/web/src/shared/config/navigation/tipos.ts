import type { Cat, NavItem } from '@recreio/design-system';

export type Perfil = 'familia' | 'aluno' | 'professor' | 'escola';

/** Item do menu. `href` é a rota do portal; o id segue o do protótipo. */
export type ItemDeNavegacao = NavItem & { href: string };

export type GrupoDeNavegacao = { label?: string; items: ItemDeNavegacao[] };

/** Menu de um perfil: grupos do menu lateral e até 4 destinos da barra inferior, mais o "Mais". */
export type NavegacaoDoPerfil = {
  perfil: Perfil;
  /** Nome do perfil na tela de escolha. */
  titulo: string;
  /** O que o perfil faz no portal, em uma frase curta. */
  descricao: string;
  icone: string;
  cor: Cat;
  /** Rota de entrada do perfil, igual ao href do primeiro item. */
  base: string;
  grupos: GrupoDeNavegacao[];
  /** Ids dos itens que vão para a barra inferior do celular, na ordem. */
  barraInferior: Array<{ id: string; label: string }>;
};
