# Portal web

Como o portal (`apps/web`) se organiza por perfil, como adicionar uma tela e como funcionam PWA, tema, acessibilidade e Storybook. As camadas e as regras de importação estão em [arquitetura.md](arquitetura.md).

## Rotas por perfil

Até existir login, `/` mostra a escolha de perfil (tela `App-Perfil-Escolha`). Cada perfil tem a própria casca, com menu lateral no desktop e barra inferior no celular.

| Rota                    | Casca          | Tela                                                                    | Fonte no protótipo             |
| ----------------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------ |
| `/`                     | `AvulsaLayout` | Escolha de perfil                                                       | `App-Perfil-Escolha`           |
| `/preferencias`         | `AvulsaLayout` | Acessibilidade e leitura (`PreferencesPanel`)                           | `Familia-Preferencias`         |
| `/sem-internet`         | `AvulsaLayout` | O que funciona sem conexão                                              | `Celular-Offline`              |
| `/familia`              | `PerfilLayout` | Hoje e mais 25 itens do menu, todos em construção                       | `Familia-Hoje`, `Celular-Hoje` |
| `/aluno`                | `PerfilLayout` | Hoje e mais 7 itens do menu, todos em construção                        | `Aluno-Hoje`                   |
| `/professor`            | `PerfilLayout` | Início e mais 10 itens do menu, todos em construção                     | `Professor-Inicio`             |
| `/escola`               | `PerfilLayout` | Painel: unidades e alunos (`InicioPage`); outros 40 itens em construção | `Escola-Painel`                |
| `/escola/alunos`        | `PerfilLayout` | Alunos matriculados (`AlunosPage`)                                      | `Escola-Alunos`                |
| `/<perfil>/mais`        | `PerfilLayout` | Menu inteiro do perfil, aberto pelo "Mais" da barra inferior            | `Celular-Mais`                 |
| `/<perfil>/<item>`      | `PerfilLayout` | "Em construção" (`EmConstrucaoPage`) até a tela ser portada             | O `.dc.html` do item           |
| Qualquer outro endereço | A do contexto  | Página não encontrada                                                   |                                |

Os itens de cada menu (rótulo, ícone, grupo e rota) estão em `src/shared/config/navigation/<perfil>.ts`, copiados do `renderVals()` da tela do protótipo. O grupo "Conta" (Acessibilidade e Trocar perfil) vem de `comum.ts` e aparece nos 4 perfis.

## Cascas

- `shared/layout/PerfilLayout.tsx`: `AppShell` com `SideNav` (todos os grupos do perfil) e `TabBar` (4 destinos e "Mais"). O CSS do `AppShell` troca um pelo outro abaixo de 860px. O item ativo é o de rota mais longa que casa com o endereço; fora dos 4 destinos, a barra inferior marca "Mais".
- `shared/layout/AvulsaLayout.tsx`: coluna centralizada de até 960px para as telas fora de um perfil.
- As duas cascas mostram `AvisoSemInternet` no topo quando o navegador fica sem conexão.

## Adicionar uma tela

1. Crie a consulta e os componentes em `features/<dominio>` (veja [CONTRIBUTING.md](../CONTRIBUTING.md)).
2. Crie a página em `pages/<pagina>/<Pagina>Page.tsx`. Use `QueryState` de `shared/ui` para carregando, vazio e erro.
3. Se o item já existe no menu do perfil, registre a página em `TELAS_PRONTAS` de `app/router.tsx`, pelo `href` do item. A rota passa a abrir a tela no lugar de "Em construção".
4. Se o item não existe, acrescente-o em `shared/config/navigation/<perfil>.ts` e faça o passo 3. Para ir à barra inferior do celular, coloque o id em `barraInferior` (no máximo 4).
5. Teste a página com `renderRoute('/<perfil>/<item>')` e `mockApi` de `src/test/render.tsx`.

## Estados de tela

`QueryState` recebe o resultado do `useQuery` e decide o que mostrar:

| Estado     | Componente                        | Observação                                                                             |
| ---------- | --------------------------------- | -------------------------------------------------------------------------------------- |
| Carregando | `LoadingCard` ou `esqueleto`      | `esqueleto` recebe um esqueleto no formato do conteúdo real.                           |
| Erro       | `ErrorState` com "Tentar de novo" | Sem conexão, o texto passa a ser o de offline. Detalhe técnico fica em "Ver detalhes". |
| Vazio      | `EmptyState`                      | Padrão: lista sem itens. `vazio.quando` define outro critério.                         |
| Com dado   | `children(data)`                  | Recebe o dado já tipado.                                                               |

## PWA

O `vite-plugin-pwa` gera o service worker com Workbox (`generateSW`) no `vite build`. A configuração fica em `apps/web/vite.config.ts`.

- Manifesto em português: nome "Recreio", `lang: pt-BR`, `display: standalone`. `theme_color` e `background_color` são lidos de `tokens.css` (`--brand` e `--surface-0`) no build, e a mesma cor vai para a `<meta name="theme-color">`.
- Ícones em `apps/web/public/icons/`: 192, 512, maskable 512 (símbolo em 80% do quadro) e `apple-touch-icon` 180. Eles saem de `packages/design-system/assets/recreio-icone-app.png` por `npm run icones -w @recreio/web`. Os PNGs ficam no repositório; rode o script só quando o ícone mudar.
- Cache: JS, CSS, HTML e ícones entram no precache. Toda navegação abre o `index.html` salvo, então o portal abre sem conexão e o React Router mostra a tela.
- `/api/` é sempre `NetworkOnly` e fica fora do fallback de navegação. Dado da escola nunca vem do cache do service worker; sem conexão, a tela mostra o `ErrorState` de offline e a faixa "Sem internet" leva a `/sem-internet`.
- O service worker não roda em `npm run dev`. Para testar, use `npm run build -w @recreio/web` e `npm run preview -w @recreio/web`.

### Fluxo de atualização

`registerType: 'prompt'`: a versão nova fica esperando até a pessoa aceitar.

1. Um deploy publica `sw.js` novo. O navegador baixa e instala em segundo plano.
2. `AvisoDeAtualizacao` (montado em `main.tsx`) recebe `needRefresh` do `useRegisterSW` e mostra um toast do design system: "Versão nova do portal", com o botão "Atualizar agora". O toast não some sozinho.
3. "Atualizar agora" chama `updateServiceWorker(true)`: o service worker novo assume e a página recarrega. Quem fecha o toast continua na versão atual até a próxima visita.

## Tema da escola

`useEscolaTema()` (`features/escola`) lê `corMarca` de `escolaQuery` e entrega a cor ao `seed` do `RecreioProvider` em `app/providers.tsx`. O `SchoolTheme` do design system deriva a paleta da cor. Enquanto a escola carrega, ou se a API falha, vale o azul Recreio `#0067CC`.

## Acessibilidade

- `/preferencias` usa o `PreferencesPanel`: tema (claro, escuro, alto contraste), tamanho do texto até 200%, espaçamento, fonte legível, leitura simples, movimento reduzido e modo foco. A prévia muda na hora.
- "Salvar preferências" grava em `localStorage` (`recreio.preferencias`), validado com Zod ao ler. O `RecreioProvider` começa com essas preferências na próxima visita. Com login, elas passam para a conta.
- O menu lateral e a barra inferior usam `aria-current="page"` no item ativo. As listas de links têm rótulo próprio para leitor de tela.

## Storybook

```bash
npm run storybook          # Storybook do design system em http://localhost:6006
npm run build-storybook    # gera packages/design-system/storybook-static
```

- Configuração em `packages/design-system/.storybook`: `main.ts` (framework `@storybook/react-vite`, addon de acessibilidade) e `preview.tsx` (importa `tokens.css` e `recreio.css` e envolve cada história no `RecreioProvider`).
- A barra de ferramentas troca o tema (4 modos) e a cor da escola, para conferir contraste e marca em cada componente.
- Histórias em `packages/design-system/stories/` para Button, Alert, Card, StatCard, DataTable, EmptyState, SideNav e TabBar. Os dados vêm de `prototipo/docs/dados-canonicos.md` (`stories/dados.ts`).
- O painel Accessibility roda o axe em cada história; violação aparece como erro.
- `storybook-static/` fica fora do Git, do ESLint e do Prettier.
