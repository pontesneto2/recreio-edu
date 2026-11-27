import { type Eu, euSchema } from '@recreio/contracts';

const CHAVE = 'recreio.sessao';

/**
 * Última resposta de `/api/v1/eu` neste navegador, para a casca abrir sem conexão (PWA).
 * Guarda nome, e-mail, escolas e perfis; nunca credencial. O cookie httpOnly continua sendo
 * a sessão, e a API recusa toda chamada sem ele. Sair ou um 401 apagam o valor.
 */
export const lerSessaoSalva = (): Eu | undefined => {
  try {
    const salvo = window.localStorage.getItem(CHAVE);
    const resultado = euSchema.safeParse(salvo ? JSON.parse(salvo) : undefined);
    return resultado.success ? resultado.data : undefined;
  } catch {
    return undefined;
  }
};

export const salvarSessao = (eu: Eu) => {
  try {
    window.localStorage.setItem(CHAVE, JSON.stringify(eu));
  } catch {
    // Navegador sem armazenamento: a casca não abre sem conexão, e o resto funciona.
  }
};

export const apagarSessaoSalva = () => {
  try {
    window.localStorage.removeItem(CHAVE);
  } catch {
    // Nada salvo para apagar.
  }
};
