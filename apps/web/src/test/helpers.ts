import { screen } from '@testing-library/react';

/** Faz `navigator.onLine` responder `false`. Restaure com `vi.restoreAllMocks()` no `afterEach`. */
export const simularSemInternet = () => vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(false);

/**
 * Menu lateral e barra inferior da casca do perfil. Os dois têm o rótulo "Navegação principal"
 * e ficam no DOM; o `AppShell` esconde um deles pelo CSS, que o jsdom não carrega.
 */
export const encontrarMenus = async () => {
  const [menuLateral, barraInferior] = await screen.findAllByRole('navigation', { name: 'Navegação principal' });
  if (!menuLateral || !barraInferior) throw new Error('Esperava o menu lateral e a barra inferior.');
  return { menuLateral, barraInferior };
};
