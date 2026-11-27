import { GRUPO_CONTA } from './comum.ts';
import type { NavegacaoDoPerfil } from './tipos.ts';

/** Menu do aluno. Fonte: `Aluno-Hoje` no protótipo. */
export const NAVEGACAO_ALUNO: NavegacaoDoPerfil = {
  perfil: 'aluno',
  titulo: 'Aluno',
  descricao: 'Tarefas, envio de trabalho, notas e carteirinha',
  icone: 'graduation',
  cor: 'roxo',
  base: '/aluno',
  grupos: [
    {
      items: [
        { id: 'hoje', label: 'Hoje', icon: 'home', href: '/aluno' },
        { id: 'tarefas', label: 'Tarefas', icon: 'clipboard', href: '/aluno/tarefas' },
        { id: 'entregar', label: 'Enviar trabalho', icon: 'upload', href: '/aluno/entregar' },
      ],
    },
    {
      label: 'Meus estudos',
      items: [
        { id: 'notas', label: 'Notas e frequência', icon: 'chart', href: '/aluno/notas' },
        { id: 'horario', label: 'Horário de aulas', icon: 'clock', href: '/aluno/horario' },
        { id: 'materiais', label: 'Materiais de aula', icon: 'paperclip', href: '/aluno/materiais' },
        { id: 'biblioteca', label: 'Biblioteca', icon: 'book', href: '/aluno/biblioteca' },
      ],
    },
    {
      label: 'Minha escola',
      items: [{ id: 'carteirinha', label: 'Carteirinha e acessos', icon: 'qr', href: '/aluno/carteirinha' }],
    },
    GRUPO_CONTA,
  ],
  barraInferior: [
    { id: 'hoje', label: 'Hoje' },
    { id: 'tarefas', label: 'Tarefas' },
    { id: 'notas', label: 'Notas' },
    { id: 'horario', label: 'Horário' },
  ],
};
