import { useQuery } from '@tanstack/react-query';
import { escolaQuery } from '../api/escola.queries.ts';

/** Azul Recreio: vale enquanto a escola carrega ou quando a API não responde. */
export const COR_PADRAO = '#0067CC';

/** Cor da marca da escola, usada como `seed` do tema. */
export const useEscolaTema = () => {
  const { data: escola } = useQuery(escolaQuery);
  return escola?.corMarca ?? COR_PADRAO;
};
