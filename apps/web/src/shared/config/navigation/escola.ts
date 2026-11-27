import { GRUPO_CONTA } from './comum.ts';
import type { NavegacaoDoPerfil } from './tipos.ts';

/** Menu da escola (direção, secretaria e financeiro). Fonte: `Escola-Painel` no protótipo. */
export const NAVEGACAO_ESCOLA: NavegacaoDoPerfil = {
  perfil: 'escola',
  titulo: 'Escola',
  descricao: 'Painel, secretaria, financeiro e gestão da unidade',
  icone: 'school',
  cor: 'azul',
  base: '/escola',
  grupos: [
    {
      items: [
        { id: 'painel', label: 'Painel', icon: 'home', href: '/escola' },
        { id: 'comunicados', label: 'Comunicados', icon: 'bell', href: '/escola/comunicados' },
        { id: 'chat', label: 'Chat com famílias', icon: 'chat', href: '/escola/chat' },
      ],
    },
    {
      label: 'Pedagógico',
      items: [
        { id: 'notas', label: 'Notas e faltas', icon: 'edit', href: '/escola/notas-e-faltas' },
        { id: 'chamada', label: 'Chamada', icon: 'check-circle', href: '/escola/chamada' },
        { id: 'agenda', label: 'Agenda da turma', icon: 'calendar', href: '/escola/agenda' },
        { id: 'horarios', label: 'Horários', icon: 'clock', href: '/escola/horarios' },
        { id: 'frequencia', label: 'Frequência', icon: 'clipboard', href: '/escola/frequencia' },
        { id: 'boletins', label: 'Fechamento e boletins', icon: 'chart', href: '/escola/boletins' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: 'alert', href: '/escola/ocorrencias' },
        { id: 'integral', label: 'Integral e reforço', icon: 'sun-moon', href: '/escola/integral' },
        { id: 'saude', label: 'Saúde e enfermaria', icon: 'heart', href: '/escola/saude' },
        { id: 'inclusao', label: 'Inclusão e AEE', icon: 'accessibility', href: '/escola/inclusao' },
        { id: 'medidas', label: 'Medidas disciplinares', icon: 'flag', href: '/escola/medidas' },
        { id: 'extras', label: 'Pontos extras', icon: 'star', href: '/escola/pontos-extras' },
        { id: 'eja', label: 'EJA', icon: 'moon', href: '/escola/eja' },
      ],
    },
    {
      label: 'Secretaria',
      items: [
        { id: 'alunos', label: 'Alunos', icon: 'users', href: '/escola/alunos' },
        { id: 'equipe', label: 'Equipe', icon: 'user', href: '/escola/equipe' },
        { id: 'captacao', label: 'Captação', icon: 'filter', href: '/escola/captacao' },
        { id: 'matriculas', label: 'Matrículas', icon: 'file-text', href: '/escola/matriculas' },
        { id: 'contratos', label: 'Contratos', icon: 'edit', href: '/escola/contratos' },
        { id: 'solicitacoes', label: 'Solicitações', icon: 'file', href: '/escola/solicitacoes' },
        { id: 'certificados', label: 'Certificados e diplomas', icon: 'graduation', href: '/escola/certificados' },
        { id: 'transferencias', label: 'Transferências', icon: 'sync', href: '/escola/transferencias' },
        { id: 'fotos', label: 'Fotos de alunos', icon: 'camera', href: '/escola/fotos' },
        { id: 'importacao', label: 'Migração de dados', icon: 'upload', href: '/escola/importacao' },
        { id: 'calendario', label: 'Calendário letivo', icon: 'flag', href: '/escola/calendario' },
        { id: 'autorizacoes', label: 'Passeios e autorizações', icon: 'key', href: '/escola/autorizacoes' },
        { id: 'portaria', label: 'Portaria', icon: 'gate', href: '/escola/portaria' },
        { id: 'biblioteca', label: 'Biblioteca', icon: 'book', href: '/escola/biblioteca' },
      ],
    },
    {
      label: 'Família e serviços',
      items: [
        { id: 'atendimentos', label: 'Atendimentos', icon: 'hand', href: '/escola/atendimentos' },
        { id: 'cardapio', label: 'Cardápio', icon: 'utensils', href: '/escola/cardapio' },
        { id: 'galeria', label: 'Galeria de fotos', icon: 'image', href: '/escola/galeria' },
        { id: 'loja', label: 'Loja da escola', icon: 'tag', href: '/escola/loja' },
        { id: 'pesquisas', label: 'Pesquisas', icon: 'target', href: '/escola/pesquisas' },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { id: 'mensalidades', label: 'Mensalidades', icon: 'wallet', href: '/escola/mensalidades' },
        { id: 'fiscal', label: 'Notas fiscais e IR', icon: 'receipt', href: '/escola/fiscal' },
        { id: 'dae', label: 'DAE SEFAZ-CE', icon: 'receipt', href: '/escola/dae' },
        { id: 'caixa', label: 'Caixa e contas a pagar', icon: 'card', href: '/escola/caixa' },
      ],
    },
    {
      label: 'Gestão',
      items: [
        { id: 'relatorios', label: 'Relatórios e censo', icon: 'sparkline', href: '/escola/relatorios' },
        { id: 'permissoes', label: 'Grupos e permissões', icon: 'shield', href: '/escola/permissoes' },
        { id: 'modulos', label: 'Módulos e marca', icon: 'modules', href: '/escola/modulos' },
      ],
    },
    GRUPO_CONTA,
  ],
  barraInferior: [
    { id: 'painel', label: 'Painel' },
    { id: 'notas', label: 'Notas' },
    { id: 'chamada', label: 'Chamada' },
    { id: 'comunicados', label: 'Avisos' },
  ],
};
