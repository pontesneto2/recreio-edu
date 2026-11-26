import { z } from 'zod';

export const alunoSchema = z.object({
  id: z.string(),
  nome: z.string(),
  turma: z.string(),
  turno: z.string(),
  matricula: z.string().regex(/^\d{4}-\d{4}$/),
  mensalidade: z.number().positive(),
});

export const alunoIdSchema = z.string().regex(/^[a-z0-9-]+$/);

export type Aluno = z.infer<typeof alunoSchema>;
