/**
 * Diz se a origem casa com algum padrão da lista. O padrão aceita `*` num rótulo do host:
 * `https://*.recreio.app` casa com `https://colegiorecreio.recreio.app` e não com `https://recreio.app`.
 */
export const origemConfiavel = (origem: string, padroes: readonly string[]): boolean =>
  padroes.some((padrao) => {
    if (!padrao.includes('*')) return padrao === origem;
    const regex = padrao.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replaceAll('*', '[a-z0-9-]+');
    return new RegExp(`^${regex}$`, 'i').test(origem);
  });

/**
 * Origem dos links enviados por e-mail. Usa o `Origin` da requisição quando ele está na lista,
 * para o link abrir no domínio da escola. Qualquer outro valor cai na origem padrão, então um
 * `Origin` forjado não leva o link para outro site.
 */
export const origemDoLink = (request: Request | undefined, padroes: readonly string[], padrao: string): string => {
  const origem = request?.headers.get('origin');
  return origem && origemConfiavel(origem, padroes) ? origem : padrao;
};
