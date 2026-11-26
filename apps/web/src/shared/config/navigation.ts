import type { NavItem } from '@recreio/design-system';

export type NavGroup = { label: string; items: Array<NavItem & { href: string }> };

/** Menu lateral do portal. Cada item aponta para uma rota de `app/router.tsx`. */
export const NAVIGATION: NavGroup[] = [
  {
    label: 'Escola',
    items: [
      { id: 'inicio', label: 'Início', icon: 'home', href: '/' },
      { id: 'alunos', label: 'Alunos', icon: 'users', href: '/alunos' },
      { id: 'financeiro', label: 'Financeiro', icon: 'wallet', href: '/financeiro' },
    ],
  },
];
