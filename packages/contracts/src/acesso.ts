import { z } from 'zod';

/** Perfis de um vínculo entre pessoa e escola (ADR 0007). Uma pessoa pode ter vários na mesma escola. */
export const PERFIS_DE_VINCULO = [
  'responsavel',
  'aluno',
  'professor',
  'secretaria',
  'financeiro',
  'portaria',
  'coordenacao',
  'direcao',
] as const;

/** Ações que uma permissão libera num módulo. */
export const ACOES = ['ver', 'criar', 'editar', 'excluir', 'aprovar'] as const;

/** Módulos do portal, na ordem de `Escola-Permissoes` no protótipo. */
export const MODULOS = [
  'painel',
  'comunicados',
  'chat',
  'notas',
  'chamada',
  'agenda',
  'frequencia',
  'boletins',
  'ocorrencias',
  'integral',
  'horarios',
  'saude',
  'inclusao',
  'alunos',
  'equipe',
  'captacao',
  'matriculas',
  'contratos',
  'autorizacoes',
  'portaria',
  'biblioteca',
  'certificados',
  'transferencias',
  'fotos',
  'importacao',
  'medidas',
  'extras',
  'eja',
  'dae',
  'solicitacoes',
  'calendario',
  'atendimentos',
  'cardapio',
  'galeria',
  'loja',
  'pesquisas',
  'mensalidades',
  'fiscal',
  'caixa',
  'relatorios',
  'permissoes',
  'modulos',
] as const;

export const perfilDeVinculoSchema = z.enum(PERFIS_DE_VINCULO);
export const acaoSchema = z.enum(ACOES);
export const moduloSchema = z.enum(MODULOS);

/**
 * Identificador da escola na rota (ADR 0011): `/colegio-recreio/entrar`, `/api/v1/escolas/colegio-recreio`.
 * Minúsculas, números e hífen.
 */
export const slugDaEscolaSchema = z
  .string()
  .min(1)
  .max(63)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);

/** Dados da escola que a tela de entrada mostra antes do login. */
export const escolaPublicaSchema = z.object({
  slug: slugDaEscolaSchema,
  nome: z.string(),
  cidade: z.string(),
  corMarca: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export const usuarioSchema = z.object({
  id: z.string().min(1),
  nome: z.string(),
  email: z.email(),
  emailVerificado: z.boolean(),
});

/** Escola em que a pessoa tem vínculo, com os perfis dela nessa escola. */
export const escolaDoUsuarioSchema = z.object({
  slug: slugDaEscolaSchema,
  nome: z.string(),
  perfis: z.array(perfilDeVinculoSchema).min(1),
});

/**
 * Resposta de `GET /api/v1/eu`: quem está logado e os vínculos em todas as escolas.
 * Lista vazia quando a conta ainda não tem vínculo.
 */
export const euSchema = z.object({
  usuario: usuarioSchema,
  escolas: z.array(escolaDoUsuarioSchema),
});

export type PerfilDeVinculo = z.infer<typeof perfilDeVinculoSchema>;
export type Acao = z.infer<typeof acaoSchema>;
export type Modulo = z.infer<typeof moduloSchema>;
export type EscolaPublica = z.infer<typeof escolaPublicaSchema>;
export type Usuario = z.infer<typeof usuarioSchema>;
export type EscolaDoUsuario = z.infer<typeof escolaDoUsuarioSchema>;
export type Eu = z.infer<typeof euSchema>;
