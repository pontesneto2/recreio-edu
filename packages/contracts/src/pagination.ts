import { z } from 'zod';

/** Query de listas paginadas por cursor: `?limit=20&cursor=...`. O cliente repassa o cursor sem interpretar. */
export const cursorQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  cursor: z.string().min(1).max(512).optional(),
});

/** Resposta de lista paginada. `nextCursor` é `null` na última página. */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    data: z.array(item),
    nextCursor: z.string().nullable(),
  });

export type CursorQuery = z.infer<typeof cursorQuerySchema>;
export type Paginated<T> = { data: T[]; nextCursor: string | null };
