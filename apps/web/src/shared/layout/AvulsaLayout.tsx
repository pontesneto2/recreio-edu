import { AvisoSemInternet } from '../pwa/AvisoSemInternet.tsx';
import { ConteudoDaRota } from './ConteudoDaRota.tsx';

const COLUNA_STYLE = {
  maxWidth: 960,
  marginInline: 'auto',
  display: 'grid',
  gridTemplateColumns: 'minmax(0, 1fr)',
  gap: 24,
} as const;

/** Casca das telas fora de um perfil (escolha de perfil, preferências, sem internet): uma coluna centralizada. */
export const AvulsaLayout = () => (
  <main className="rc-shell-content" id="conteudo">
    <div style={COLUNA_STYLE}>
      <AvisoSemInternet />
      <ConteudoDaRota />
    </div>
  </main>
);
