import { useParams } from 'react-router';

/** Nome do parâmetro de rota com o slug da escola: `/:escola/familia` (ADR 0011). */
export const PARAMETRO_DA_ESCOLA = 'escola';

/** Slug da escola da rota atual, ou `undefined` fora de `/:escola/...` (Entrar global, Sair global). */
export const useEscolaDaRotaOpcional = (): string | undefined => useParams()[PARAMETRO_DA_ESCOLA];

/** Slug da escola da rota atual. Falha quando o componente está fora de `/:escola/...`. */
export const useEscolaDaRota = (): string => {
  const escola = useEscolaDaRotaOpcional();
  if (!escola) throw new Error('Componente fora de /:escola: a rota não tem o slug da escola.');
  return escola;
};
