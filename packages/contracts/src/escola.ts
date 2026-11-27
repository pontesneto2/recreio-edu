import { z } from 'zod';

export const unidadeSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  /** Quantidade de alunos cadastrados na unidade. */
  alunos: z.int().nonnegative(),
});

export const escolaSchema = z.object({
  nome: z.string(),
  cnpj: z.string(),
  cidade: z.string(),
  corMarca: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
  hoje: z.iso.date(),
  unidades: z.array(unidadeSchema),
});

export type Unidade = z.infer<typeof unidadeSchema>;
export type Escola = z.infer<typeof escolaSchema>;
