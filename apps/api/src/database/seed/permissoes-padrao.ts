import { type Acao, MODULOS, type Modulo, type PerfilDeVinculo } from '@recreio/contracts';

/*
 * Matriz de permissões de uma escola nova, por perfil. Fonte: `Escola-Permissoes` no protótipo
 * (direção, coordenação, professor titular, secretaria, financeiro e portaria). A ação `exportar`
 * do protótipo fica de fora até existir exportação. Responsável e aluno não aparecem na matriz
 * do protótipo: valem os módulos das telas da família e do aluno, só para ver.
 * O alcance (só os próprios filhos, só as próprias turmas) é regra de cada módulo, não desta tabela.
 */

export type MatrizDePermissoes = Record<PerfilDeVinculo, Partial<Record<Modulo, readonly Acao[]>>>;

const V = ['ver'] as const;
const VC = ['ver', 'criar'] as const;
const VCE = ['ver', 'criar', 'editar'] as const;
const TODAS = ['ver', 'criar', 'editar', 'excluir', 'aprovar'] as const;

export const PERMISSOES_PADRAO: MatrizDePermissoes = {
  direcao: Object.fromEntries(MODULOS.map((modulo) => [modulo, TODAS])),
  coordenacao: {
    painel: V,
    comunicados: ['ver', 'criar', 'editar', 'aprovar'],
    chat: VCE,
    notas: ['ver', 'editar', 'aprovar'],
    chamada: ['ver', 'editar'],
    agenda: ['ver', 'criar', 'editar', 'aprovar'],
    frequencia: ['ver', 'editar', 'aprovar'],
    boletins: ['ver', 'criar', 'editar', 'aprovar'],
    ocorrencias: TODAS,
    integral: V,
    alunos: V,
    autorizacoes: VCE,
    saude: V,
    inclusao: ['ver', 'editar', 'aprovar'],
    relatorios: V,
    portaria: ['ver', 'editar', 'aprovar'],
    biblioteca: ['ver', 'editar', 'aprovar'],
    medidas: TODAS,
    extras: ['ver', 'criar', 'editar', 'aprovar'],
    eja: VCE,
    certificados: ['ver', 'aprovar'],
  },
  professor: {
    comunicados: VC,
    notas: VCE,
    chamada: VCE,
    agenda: VCE,
    frequencia: V,
    ocorrencias: VC,
    horarios: V,
    atendimentos: VCE,
  },
  secretaria: {
    comunicados: VC,
    alunos: VCE,
    captacao: TODAS,
    matriculas: TODAS,
    contratos: VCE,
    autorizacoes: VCE,
    portaria: V,
    certificados: VCE,
    transferencias: VCE,
    fotos: VCE,
    importacao: VC,
  },
  financeiro: {
    comunicados: V,
    alunos: V,
    contratos: V,
    mensalidades: TODAS,
    fiscal: TODAS,
    caixa: VCE,
    dae: TODAS,
  },
  portaria: {
    comunicados: V,
    autorizacoes: V,
    portaria: VCE,
  },
  responsavel: {
    comunicados: V,
    agenda: V,
    calendario: V,
    chat: VC,
    autorizacoes: ['ver', 'aprovar'],
    frequencia: V,
    boletins: V,
    mensalidades: V,
    cardapio: V,
    galeria: V,
    atendimentos: VC,
  },
  aluno: {
    comunicados: V,
    agenda: V,
    calendario: V,
    notas: V,
    boletins: V,
    horarios: V,
    biblioteca: V,
    cardapio: V,
  },
};

/** Linhas de `permissoes` de uma escola, a partir da matriz. */
export const linhasDePermissao = (matriz: MatrizDePermissoes = PERMISSOES_PADRAO) =>
  Object.entries(matriz).flatMap(([perfil, modulos]) =>
    Object.entries(modulos).map(([modulo, acoes]) => ({
      perfil: perfil as PerfilDeVinculo,
      modulo: modulo as Modulo,
      acoes: [...(acoes ?? [])],
    })),
  );
