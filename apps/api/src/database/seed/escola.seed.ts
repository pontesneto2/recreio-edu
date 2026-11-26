import type { Aluno, Escola } from '@recreio/contracts';

/* Dados de demonstração do Colégio Recreio. Fonte: prototipo/docs/dados-canonicos.md. */

export const escolaSeed: Escola = {
  nome: 'Colégio Recreio',
  cnpj: '07.412.386/0001-52',
  cidade: 'Fortaleza',
  corMarca: '#0067CC',
  hoje: '2026-11-25',
  unidades: [
    { id: 'aldeota', nome: 'Unidade Aldeota', alunos: 1248 },
    { id: 'eusebio', nome: 'Unidade Eusébio', alunos: 936 },
  ],
};

export const alunosSeed: Aluno[] = [
  {
    id: 'ana-beatriz',
    nome: 'Ana Beatriz Lima',
    turma: '9º ano A',
    turno: 'Manhã',
    matricula: '2018-0214',
    mensalidade: 1620,
  },
  {
    id: 'davi',
    nome: 'Davi Lima',
    turma: '2º ano B',
    turno: 'Manhã com integral à tarde',
    matricula: '2024-0318',
    mensalidade: 1480,
  },
];
