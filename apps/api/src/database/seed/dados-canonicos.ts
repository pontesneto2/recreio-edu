import type { Turno } from '../schema/index.ts';

/* Dados de demonstração do Colégio Recreio. Fonte: prototipo/docs/dados-canonicos.md. */

export type DadosEscolaSeed = {
  escola: { nome: string; cnpj: string; cidade: string; corMarca: string; dominio: string };
  unidades: { slug: string; nome: string }[];
  turmas: { unidade: string; nome: string; turno: Turno; anoLetivo: number }[];
  alunos: { unidade: string; turma: string; nome: string; matricula: string; mensalidadeCentavos: number }[];
};

export const colegioRecreio = (dominio: string): DadosEscolaSeed => ({
  escola: {
    nome: 'Colégio Recreio',
    cnpj: '07.412.386/0001-52',
    cidade: 'Fortaleza',
    corMarca: '#0067CC',
    dominio,
  },
  unidades: [
    { slug: 'aldeota', nome: 'Unidade Aldeota' },
    { slug: 'eusebio', nome: 'Unidade Eusébio' },
  ],
  turmas: [
    { unidade: 'aldeota', nome: '9º ano A', turno: 'manha', anoLetivo: 2026 },
    { unidade: 'aldeota', nome: '2º ano B', turno: 'manha', anoLetivo: 2026 },
  ],
  alunos: [
    {
      unidade: 'aldeota',
      turma: '9º ano A',
      nome: 'Ana Beatriz Lima',
      matricula: '2018-0214',
      mensalidadeCentavos: 162000,
    },
    { unidade: 'aldeota', turma: '2º ano B', nome: 'Davi Lima', matricula: '2024-0318', mensalidadeCentavos: 148000 },
  ],
});
