import type { PerfilDeVinculo } from '@recreio/contracts';
import type { Turno } from '../schema/index.ts';

/* Dados de demonstração do Colégio Recreio. Fonte: prototipo/docs/dados-canonicos.md. */

export type DadosEscolaSeed = {
  escola: { nome: string; cnpj: string; cidade: string; corMarca: string; slug: string };
  unidades: { slug: string; nome: string }[];
  turmas: { unidade: string; nome: string; turno: Turno; anoLetivo: number }[];
  alunos: { unidade: string; turma: string; nome: string; matricula: string; mensalidadeCentavos: number }[];
  /** Contas de demonstração com e-mail confirmado. A senha vem de SEED_SENHA_PADRAO. */
  usuarios?: { nome: string; email: string; perfis: PerfilDeVinculo[] }[];
};

/** Domínio dos e-mails de demonstração. `.test` é reservado e nunca entrega para fora. */
export const DOMINIO_DOS_EMAILS = 'colegiorecreio.test';

const pessoa = (nome: string, usuario: string, perfil: PerfilDeVinculo) => ({
  nome,
  email: `${usuario}@${DOMINIO_DOS_EMAILS}`,
  perfis: [perfil],
});

/** Slug do Colégio Recreio nas rotas: `/colegio-recreio/entrar` (ADR 0011). */
export const SLUG_COLEGIO_RECREIO = 'colegio-recreio';

export const colegioRecreio = (): DadosEscolaSeed => ({
  escola: {
    nome: 'Colégio Recreio',
    cnpj: '07.412.386/0001-52',
    cidade: 'Fortaleza',
    corMarca: '#0067CC',
    slug: SLUG_COLEGIO_RECREIO,
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
  usuarios: [
    pessoa('Fernanda Lima', 'fernanda.lima', 'responsavel'),
    pessoa('Ana Beatriz Lima', 'ana.beatriz.lima', 'aluno'),
    pessoa('Ricardo Albuquerque', 'ricardo.albuquerque', 'professor'),
    pessoa('Renata Alencar', 'renata.alencar', 'secretaria'),
    pessoa('Paulo Ribeiro', 'paulo.ribeiro', 'financeiro'),
    pessoa('Francisco Araújo', 'francisco.araujo', 'portaria'),
    pessoa('Juliana Sampaio', 'juliana.sampaio', 'coordenacao'),
    pessoa('Lúcia Menezes', 'lucia.menezes', 'direcao'),
  ],
});
