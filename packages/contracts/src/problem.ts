import { z } from 'zod';

/** Códigos estáveis de erro. O portal decide o que mostrar por eles, sem ler o texto. */
export const problemCodeSchema = z.enum([
  'DADOS_INVALIDOS',
  'NAO_ENCONTRADO',
  'CORPO_GRANDE_DEMAIS',
  'LIMITE_EXCEDIDO',
  'ERRO_INTERNO',
]);

const fieldErrorsSchema = z.record(z.string(), z.array(z.string())).meta({
  description: 'Mensagens por campo quando `code` é `DADOS_INVALIDOS`. A chave `$` marca erro fora de campo.',
});

/** Corpo de erro da API no formato RFC 9457 (`application/problem+json`). */
export const problemSchema = z.object({
  type: z.url().meta({ description: 'URL que identifica o tipo de erro.' }),
  title: z.string().meta({ description: 'Resumo do tipo de erro. Igual para todo erro do mesmo tipo.' }),
  status: z.int().min(400).max(599).meta({ description: 'Status HTTP da resposta.' }),
  detail: z.string().optional().meta({ description: 'Explicação deste erro em particular.' }),
  instance: z.string().optional().meta({ description: 'Caminho da requisição que falhou, sem a query.' }),
  code: z.string().meta({ description: 'Código estável do erro, como `NAO_ENCONTRADO`.' }),
  errors: fieldErrorsSchema.optional(),
});

export type ProblemCode = z.infer<typeof problemCodeSchema>;
export type Problem = z.infer<typeof problemSchema>;
