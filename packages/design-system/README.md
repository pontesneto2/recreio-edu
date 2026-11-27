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

## Testes

```sh
npm test -w @recreio/design-system          # uma rodada (Vitest + jsdom)
npm run test:watch -w @recreio/design-system # modo observação
```

Os testes ficam ao lado dos componentes (`src/*.test.tsx`) e passam pelo React Compiler, como no portal. O `src/test/setup.ts` simula `matchMedia` e `scrollIntoView`, que o jsdom não tem. Na raiz, `npm test` roda os testes de todos os pacotes.

## Regras do React Compiler

O ESLint (`react-hooks`) trata como erro os padrões que fazem o compilador pular o componente:

- `set-state-in-effect`: não chame `setState` direto no corpo de um efeito. Derive o valor no render, ajuste o estado no render guardando a prop anterior em estado, troque a `key` ou chame o `setState` no evento.
- `exhaustive-deps`: liste todas as dependências do efeito. Se isso criar laço, use atualização funcional ou `useEffectEvent`.
- `static-components`: componente declarado dentro de outro vai para o escopo do módulo.
- `refs`: não leia nem escreva `ref.current` durante o render; use `useState` com inicializador ou leia a ref em efeitos e eventos.
- `immutability`: não altere props, estado, resultados de hooks nem variáveis do render depois que ele termina; calcule índices e listas antes do JSX.
