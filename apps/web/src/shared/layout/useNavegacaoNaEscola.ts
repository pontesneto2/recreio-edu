import type { NavegacaoDoPerfil } from '../config/navigation/index.ts';
import { useEscolaDaRota } from '../sessao/escola-da-rota.ts';
import { navegacaoNaEscola } from './navegacao.ts';

/** Menu do perfil com os links da escola da rota atual. */
export const useNavegacaoNaEscola = (navegacao: NavegacaoDoPerfil) => navegacaoNaEscola(navegacao, useEscolaDaRota());
