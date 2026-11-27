/** Rota da tela de entrada sem escola. Com escola, `/:escola/entrar` mostra a marca dela. */
export const ROTA_ENTRAR = '/entrar';

/**
 * Caminho de volta depois de entrar. Só aceita caminho interno (`/colegio-recreio/escola/alunos`),
 * nunca `//outro.site` nem URL completa, para o login não virar redirecionamento aberto.
 */
export const caminhoDeVolta = (voltar: string | null): string | undefined =>
  voltar && /^\/(?![/\\])/.test(voltar) ? voltar : undefined;

/** Tela de entrada da escola (ou a global), com o caminho de volta quando ele não é o início. */
export const rotaDeEntrar = (escola?: string, voltar?: string) => {
  const base = escola ? `/${escola}${ROTA_ENTRAR}` : ROTA_ENTRAR;
  const inicio = escola ? `/${escola}` : '/';
  return voltar && voltar !== inicio ? `${base}?${new URLSearchParams({ voltar })}` : base;
};
