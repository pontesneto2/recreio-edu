import { GRUPO_CONTA } from './comum.ts';
import type { NavegacaoDoPerfil } from './tipos.ts';

/** Menu do professor. Fonte: `Professor-Inicio` no protótipo. */
export const NAVEGACAO_PROFESSOR: NavegacaoDoPerfil = {
  perfil: 'professor',
  titulo: 'Professor',
  descricao: 'Chamada, notas, agenda e ocorrência das suas turmas',
  icone: 'edit',
  cor: 'laranja',
  base: '/professor',
  grupos: [
    {
      items: [
        { id: 'inicio', label: 'Início', icon: 'home', href: '/professor' },
        { id: 'comunicados', label: 'Comunicados', icon: 'bell', href: '/professor/comunicados' },
      ],
    },
    {
      label: 'Minhas turmas',
      items: [
        { id: 'diario', label: 'Diário de classe', icon: 'clipboard', href: '/professor/diario' },
        { id: 'chamada', label: 'Chamada', icon: 'check-circle', href: '/professor/chamada' },
        { id: 'notas', label: 'Notas e faltas', icon: 'edit', href: '/professor/notas-e-faltas' },
        { id: 'tarefas', label: 'Tarefas', icon: 'list', href: '/professor/tarefas' },
        { id: 'agenda', label: 'Agenda da turma', icon: 'calendar', href: '/professor/agenda' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: 'alert', href: '/professor/ocorrencias' },
      ],
    },
    {
      label: 'Planejamento',
      items: [
        { id: 'horarios', label: 'Meus horários', icon: 'clock', href: '/professor/horarios' },
        { id: 'materiais', label: 'Materiais de aula', icon: 'paperclip', href: '/professor/materiais' },
        { id: 'atendimentos', label: 'Atendimentos', icon: 'hand', href: '/professor/atendimentos' },
      ],
    },
    GRUPO_CONTA,
  ],
  barraInferior: [
    { id: 'inicio', label: 'Início' },
    { id: 'diario', label: 'Diário' },
    { id: 'chamada', label: 'Chamada' },
    { id: 'notas', label: 'Notas' },
  ],
};
