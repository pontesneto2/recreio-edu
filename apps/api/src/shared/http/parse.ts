import { z } from 'zod';
import { type FieldErrors, ValidationError } from '../errors/app-error.ts';

// Mensagens do Zod em português, porque elas chegam ao cliente no campo `errors`.
z.config(z.locales.ptBR());

/** Chave de `errors` para falhas que não pertencem a um campo, como um corpo que não é objeto. */
export const ROOT_FIELD = '$';

const toFieldErrors = (error: z.ZodError): FieldErrors => {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const field = issue.path.map(String).join('.') || ROOT_FIELD;
    (errors[field] ??= []).push(issue.message);
  }
  return errors;
};

/** Valida a entrada da requisição com Zod e responde 400 quando ela não segue o schema. */
export const parseInput = <S extends z.ZodType>(schema: S, input: unknown): z.infer<S> => {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError('Os dados enviados não são válidos.', toFieldErrors(result.error));
  return result.data;
};
