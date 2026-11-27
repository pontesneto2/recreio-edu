import { GRUPO_CONTA } from './comum.ts';
import type { NavegacaoDoPerfil } from './tipos.ts';

/** Menu da família. Fonte: `Familia-Hoje` e `Celular-Hoje` no protótipo. */
export const NAVEGACAO_FAMILIA: NavegacaoDoPerfil = {
  perfil: 'familia',
  titulo: 'Responsável',
  descricao: 'Agenda, boletim, mensalidades e conversas com a escola',
  icone: 'users',
  cor: 'verde',
  base: '/familia',
  grupos: [
    {
      items: [
        { id: 'hoje', label: 'Hoje', icon: 'home', href: '/familia' },
        { id: 'agenda', label: 'Agenda', icon: 'calendar', href: '/familia/agenda' },
        { id: 'calendario', label: 'Calendário', icon: 'flag', href: '/familia/calendario' },
        { id: 'comunicados', label: 'Comunicados', icon: 'bell', href: '/familia/comunicados' },
        { id: 'chat', label: 'Chat', icon: 'chat', href: '/familia/chat' },
        { id: 'autorizacoes', label: 'Autorizações', icon: 'key', href: '/familia/autorizacoes' },
      ],
    },
    {
      label: 'Acadêmico',
      items: [
        { id: 'boletim', label: 'Boletim', icon: 'chart', href: '/familia/boletim' },
        { id: 'frequencia', label: 'Frequência', icon: 'check-circle', href: '/familia/frequencia' },
        { id: 'horarios', label: 'Horários', icon: 'clock', href: '/familia/horarios' },
        { id: 'integral', label: 'Integral e reforço', icon: 'sun-moon', href: '/familia/integral' },
        { id: 'inclusao', label: 'Plano individual', icon: 'star', href: '/familia/inclusao' },
        { id: 'ocorrencias', label: 'Ocorrências', icon: 'alert', href: '/familia/ocorrencias' },
        { id: 'biblioteca', label: 'Biblioteca', icon: 'book', href: '/familia/biblioteca' },
        { id: 'materiais', label: 'Materiais de aula', icon: 'paperclip', href: '/familia/materiais' },
      ],
    },
    {
      label: 'Serviços',
      items: [
        { id: 'cardapio', label: 'Cardápio', icon: 'utensils', href: '/familia/cardapio' },
        { id: 'saude', label: 'Saúde', icon: 'heart', href: '/familia/saude' },
        { id: 'documentos', label: 'Documentos', icon: 'file', href: '/familia/documentos' },
        { id: 'atendimentos', label: 'Atendimentos', icon: 'hand', href: '/familia/atendimentos' },
        { id: 'galeria', label: 'Galeria de fotos', icon: 'image', href: '/familia/galeria' },
        { id: 'loja', label: 'Loja da escola', icon: 'tag', href: '/familia/loja' },
        { id: 'pesquisas', label: 'Pesquisas', icon: 'target', href: '/familia/pesquisas' },
      ],
    },
    {
      label: 'Financeiro',
      items: [
        { id: 'financeiro', label: 'Mensalidades', icon: 'wallet', href: '/familia/financeiro' },
        { id: 'dae', label: 'DAE', icon: 'receipt', href: '/familia/dae' },
        { id: 'ir', label: 'Recibo para IR', icon: 'receipt', href: '/familia/recibo-ir' },
        { id: 'rematricula', label: 'Rematrícula', icon: 'file-text', href: '/familia/rematricula' },
        { id: 'matricula', label: 'Matrícula', icon: 'graduation', href: '/familia/matricula' },
      ],
    },
    GRUPO_CONTA,
  ],
  barraInferior: [
    { id: 'hoje', label: 'Hoje' },
    { id: 'agenda', label: 'Agenda' },
    { id: 'financeiro', label: 'Financeiro' },
    { id: 'chat', label: 'Chat' },
  ],
};
