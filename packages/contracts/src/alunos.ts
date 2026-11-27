import { z } from 'zod';

export const alunoSchema = z.object({
  id: z.uuid(),
  nome: z.string(),
  turma: z.string(),
  turno: z.string(),
  matricula: z.string().regex(/^\d{4}-\d{4}$/),
  /** Valor cheio da mensalidade em centavos (R$ 1.620,00 = 162000). */
  mensalidadeCentavos: z.int().nonnegative(),
});

export const alunoIdSchema = z.uuid();

export type Aluno = z.infer<typeof alunoSchema>;
