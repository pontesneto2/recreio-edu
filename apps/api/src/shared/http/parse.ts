import { z } from 'zod';
import { ValidationError } from '../errors/app-error.ts';

/** Valida a entrada da requisição com Zod e responde 400 quando ela não segue o schema. */
export const parseInput = <S extends z.ZodType>(schema: S, input: unknown): z.infer<S> => {
  const result = schema.safeParse(input);
  if (!result.success) throw new ValidationError('Os dados enviados não são válidos.', z.flattenError(result.error));
  return result.data;
};
