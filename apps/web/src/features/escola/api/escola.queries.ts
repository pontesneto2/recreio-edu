import { escolaSchema } from '@recreio/contracts';
import { queryOptions } from '@tanstack/react-query';
import { getJson } from '@/shared/api/http-client.ts';

export const escolaKeys = {
  all: ['escola'] as const,
};

export const escolaQuery = queryOptions({
  queryKey: escolaKeys.all,
  queryFn: () => getJson('/api/escola', escolaSchema),
});
