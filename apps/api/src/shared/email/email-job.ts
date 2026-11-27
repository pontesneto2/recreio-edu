import { z } from 'zod';

/**
 * Dados de uma tarefa da fila `emails`. Cada modelo tem as próprias variáveis.
 * Um modelo novo entra aqui e em `modelos.ts`. O typecheck falha se faltar o texto.
 */
export const emailJobSchema = z.discriminatedUnion('modelo', [
  z.object({
    modelo: z.literal('boas-vindas'),
    para: z.email(),
    variaveis: z.object({
      nome: z.string().trim().min(1),
      escola: z.string().trim().min(1),
      // Só http e https, para o link do botão nunca ser `javascript:`.
      linkAcesso: z.url({ protocol: /^https?$/ }),
    }),
  }),
  // Confirmação de e-mail e troca de senha (ADR 0007). O link aponta para o portal da escola.
  z.object({
    modelo: z.literal('confirmacao-email'),
    para: z.email(),
    variaveis: z.object({ nome: z.string().trim().min(1), link: z.url({ protocol: /^https?$/ }) }),
  }),
  z.object({
    modelo: z.literal('troca-de-senha'),
    para: z.email(),
    variaveis: z.object({ nome: z.string().trim().min(1), link: z.url({ protocol: /^https?$/ }) }),
  }),
  z.object({
    modelo: z.literal('teste'),
    para: z.email(),
    variaveis: z.object({ origem: z.string().trim().min(1) }),
  }),
]);

export type EmailJob = z.infer<typeof emailJobSchema>;
export type ModeloEmail = EmailJob['modelo'];
