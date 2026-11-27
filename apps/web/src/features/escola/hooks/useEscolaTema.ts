import { useQuery } from '@tanstack/react-query';
import { escolaPublicaQuery } from '../api/escola.queries.ts';

/** Azul Recreio: vale fora de uma escola, enquanto a escola carrega ou quando a API não responde. */
export const COR_PADRAO = '#0067CC';

/** Cor da marca da escola do slug, usada como `seed` do tema. */
export const useEscolaTema = (escola: string | undefined) => {
  const { data } = useQuery({ ...escolaPublicaQuery(escola ?? ''), enabled: Boolean(escola) });
  return (escola && data?.corMarca) || COR_PADRAO;
};
