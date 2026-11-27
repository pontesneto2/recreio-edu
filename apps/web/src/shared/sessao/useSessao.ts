import { useQuery } from '@tanstack/react-query';
import { euQuery } from './sessao.api.ts';

/** Sessão atual: carregando, erro de rede ou a situação (`anonima`, `sem-acesso`, `ativa`). */
export const useSessao = () => useQuery(euQuery);
