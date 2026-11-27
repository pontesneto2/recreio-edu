/** Prefixo dos cookies do Better Auth (ADR 0007). */
export const PREFIXO_DO_COOKIE = 'recreio';

/** Cookie de sessão. Com `Secure` ligado (produção), o Better Auth acrescenta `__Secure-` no começo. */
export const COOKIE_DE_SESSAO = `${PREFIXO_DO_COOKIE}.session_token`;
