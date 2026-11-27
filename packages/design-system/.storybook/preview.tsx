import '../src/tokens.css';
import '../src/recreio.css';
import type { Preview } from '@storybook/react-vite';
import { RecreioProvider } from '../src/index.ts';
import type { ThemeMode } from '../src/types.ts';

const TEMAS: ThemeMode[] = ['claro', 'escuro', 'alto-contraste', 'alto-contraste-escuro'];

const preview: Preview = {
  globalTypes: {
    tema: {
      description: 'Tema do Recreio',
      toolbar: { title: 'Tema', icon: 'contrast', items: TEMAS, dynamicTitle: true },
    },
    corDaEscola: {
      description: 'Cor da marca da escola (seed do SchoolTheme)',
      toolbar: {
        title: 'Cor da escola',
        icon: 'paintbrush',
        items: [
          { value: '#0067CC', title: 'Azul Recreio' },
          { value: '#1E3A8A', title: 'Marinho' },
          { value: '#7A1FA2', title: 'Roxo' },
          { value: '#0F7B4F', title: 'Verde' },
        ],
        dynamicTitle: true,
      },
    },
  },
  initialGlobals: { tema: 'claro', corDaEscola: '#0067CC' },
  decorators: [
    (Story, { globals }) => (
      <RecreioProvider seed={String(globals.corDaEscola)} theme={globals.tema as ThemeMode}>
        <div style={{ padding: 24, background: 'var(--surface-0)', minHeight: '100%' }}>
          <Story />
        </div>
      </RecreioProvider>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
    controls: { expanded: true },
    // Violação de acessibilidade (axe) aparece como erro no painel Accessibility.
    a11y: { test: 'error' },
  },
};

export default preview;
