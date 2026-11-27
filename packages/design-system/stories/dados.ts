/** Dados das histórias, tirados de `prototipo/docs/dados-canonicos.md`. */
import type { NavItem } from '../src/types.ts';

export const ESCOLA = { name: 'Colégio Recreio', unit: 'Unidade Aldeota' };

export type AlunoExemplo = { id: string; nome: string; turma: string; turno: string; responsavel: string };

export const ALUNOS: AlunoExemplo[] = [
  { id: 'ana', nome: 'Ana Beatriz Lima', turma: '9º ano A', turno: 'Manhã', responsavel: 'Fernanda Lima' },
  { id: 'davi', nome: 'Davi Lima', turma: '2º ano B', turno: 'Manhã e integral', responsavel: 'Fernanda Lima' },
  { id: 'joao', nome: 'João Pedro Cavalcante', turma: '9º ano A', turno: 'Manhã', responsavel: 'Patrícia Cavalcante' },
  { id: 'arthur', nome: 'Arthur Nogueira', turma: '9º ano A', turno: 'Manhã', responsavel: 'Cláudia Nogueira' },
  { id: 'caio', nome: 'Caio Reis', turma: '9º ano A', turno: 'Manhã', responsavel: 'Juliana Reis' },
  { id: 'mateus', nome: 'Mateus Holanda', turma: '9º ano C', turno: 'Manhã', responsavel: 'Carla Holanda' },
  { id: 'sofia', nome: 'Sofia Araújo', turma: '7º ano A', turno: 'Manhã', responsavel: 'Cláudia Araújo' },
  { id: 'laura', nome: 'Laura Menezes', turma: 'Infantil V', turno: 'Manhã', responsavel: 'Paulo Menezes' },
];

/** Menu da escola em `Escola-Painel`, com os contadores do dia 25/11. */
export const GRUPOS_ESCOLA: Array<{ label?: string; items: NavItem[] }> = [
  {
    items: [
      { id: 'painel', label: 'Painel', icon: 'home' },
      { id: 'comunicados', label: 'Comunicados', icon: 'bell' },
      { id: 'chat', label: 'Chat com famílias', icon: 'chat', count: 4 },
    ],
  },
  {
    label: 'Pedagógico',
    items: [
      { id: 'notas', label: 'Notas e faltas', icon: 'edit' },
      { id: 'chamada', label: 'Chamada', icon: 'check-circle' },
      { id: 'frequencia', label: 'Frequência', icon: 'clipboard', count: 5 },
      { id: 'ocorrencias', label: 'Ocorrências', icon: 'alert', count: 3 },
    ],
  },
  {
    label: 'Secretaria',
    items: [
      { id: 'alunos', label: 'Alunos', icon: 'users' },
      { id: 'matriculas', label: 'Matrículas', icon: 'file-text', count: 12 },
      { id: 'portaria', label: 'Portaria', icon: 'gate' },
    ],
  },
  {
    label: 'Financeiro',
    items: [{ id: 'mensalidades', label: 'Mensalidades', icon: 'wallet', count: 41, urgent: true }],
  },
];

/** Barra inferior da família em `Celular-Hoje`. */
export const ABAS_FAMILIA: NavItem[] = [
  { id: 'hoje', label: 'Hoje', icon: 'home' },
  { id: 'agenda', label: 'Agenda', icon: 'calendar', count: 2 },
  { id: 'financeiro', label: 'Financeiro', icon: 'wallet', count: 1 },
  { id: 'chat', label: 'Chat', icon: 'chat', count: 1 },
  { id: 'mais', label: 'Mais', icon: 'menu' },
];
