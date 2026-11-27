import { useSyncExternalStore } from 'react';

const assinar = (avisar: () => void) => {
  window.addEventListener('online', avisar);
  window.addEventListener('offline', avisar);
  return () => {
    window.removeEventListener('online', avisar);
    window.removeEventListener('offline', avisar);
  };
};

/** `true` quando o navegador tem conexão. Atualiza sozinho nos eventos `online` e `offline`. */
export const useConexao = () =>
  useSyncExternalStore(
    assinar,
    () => navigator.onLine,
    () => true,
  );
