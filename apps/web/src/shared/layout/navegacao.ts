import type { ItemDeNavegacao, NavegacaoDoPerfil } from '../config/navigation/index.ts';

export const ID_MAIS = 'mais';

/** Todos os itens do menu lateral, na ordem em que aparecem. */
export const itensDoMenu = (navegacao: NavegacaoDoPerfil): ItemDeNavegacao[] =>
  navegacao.grupos.flatMap((grupo) => grupo.items);

/** Rota da tela "Mais" do perfil, que lista o menu inteiro no celular. */
export const rotaDoMais = (navegacao: NavegacaoDoPerfil) => `${navegacao.base}/${ID_MAIS}`;

const casaComRota = (href: string, pathname: string) => pathname === href || pathname.startsWith(`${href}/`);

/**
 * Item do menu que corresponde à rota atual. A rota mais longa vence, então `/escola/alunos/123`
 * marca "Alunos" e não "Painel". A entrada do perfil só fica ativa na própria rota.
 */
export const encontrarItemAtivo = (navegacao: NavegacaoDoPerfil, pathname: string) =>
  itensDoMenu(navegacao)
    .filter((item) => (item.href === navegacao.base ? pathname === item.href : casaComRota(item.href, pathname)))
    .sort((a, b) => b.href.length - a.href.length)[0];

/** Barra inferior: os destinos do perfil e o "Mais", que abre o menu inteiro. */
export const itensDaBarraInferior = (navegacao: NavegacaoDoPerfil): ItemDeNavegacao[] => {
  const itens = itensDoMenu(navegacao);
  const destinos = navegacao.barraInferior.flatMap(({ id, label }) => {
    const item = itens.find((candidato) => candidato.id === id);
    return item ? [{ ...item, label }] : [];
  });
  return [...destinos, { id: ID_MAIS, label: 'Mais', icon: 'menu', href: rotaDoMais(navegacao) }];
};

/** Item ativo da barra inferior. Fora dos destinos fixos, o "Mais" fica marcado. */
export const encontrarAtivoDaBarra = (navegacao: NavegacaoDoPerfil, pathname: string) => {
  const ativo = encontrarItemAtivo(navegacao, pathname);
  const naBarra = ativo && navegacao.barraInferior.some(({ id }) => id === ativo.id);
  return naBarra ? ativo.id : ID_MAIS;
};

/** Caminho do portal dentro da escola: `/familia/agenda` vira `/colegio-recreio/familia/agenda` (ADR 0011). */
export const caminhoNaEscola = (escola: string, caminho: string) =>
  caminho === '/' ? `/${escola}` : `/${escola}${caminho}`;

/**
 * Menu do perfil com os links dentro da escola. A configuração em `shared/config/navigation` fica sem
 * o slug, e o router monta as rotas relativas a `/:escola`.
 */
export const navegacaoNaEscola = (navegacao: NavegacaoDoPerfil, escola: string): NavegacaoDoPerfil => ({
  ...navegacao,
  base: caminhoNaEscola(escola, navegacao.base),
  grupos: navegacao.grupos.map((grupo) => ({
    ...grupo,
    items: grupo.items.map((item) => ({ ...item, href: caminhoNaEscola(escola, item.href) })),
  })),
});
