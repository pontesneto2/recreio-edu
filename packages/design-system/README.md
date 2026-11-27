# @recreio/design-system

Componentes React do Sistema Recreio em TypeScript, com as telas de referência em `prototipo/`.

## Uso

```tsx
import '@recreio/design-system/tokens.css';
import '@recreio/design-system/recreio.css';
import { RecreioProvider, Button, StatCard } from '@recreio/design-system';
```

- `tokens.css`: variáveis de cor, espaço e tipografia nos 4 temas (claro, escuro, alto contraste claro e escuro).
- `recreio.css`: estilos dos componentes (classes `rc-*`).
- `telas.css`: estilos auxiliares das telas do protótipo (classes `tl-*`). Importe só nas telas portadas.
- `src/types.ts`: props de cada componente, exportadas junto com os componentes.

A documentação de cada componente está em `prototipo/design-system/components/<Nome>/`.
