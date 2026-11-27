# Portal web

Como o portal (`apps/web`) se organiza por perfil, como adicionar uma tela e como funcionam PWA, tema, acessibilidade, Storybook e os testes no navegador. As camadas e as regras de importação estão em [arquitetura.md](arquitetura.md).

## Rotas por escola e perfil

A escola vem do primeiro trecho do caminho (ADR 0011): `/colegio-recreio/familia`. Cada perfil tem a própria casca, com menu lateral no desktop e barra inferior no celular. As cascas exigem sessão e um vínculo que libere o perfil ([autenticacao.md](autenticacao.md)).

| Rota                      | Casca           | Tela                                                                                   | Fonte no protótipo                     |
| ------------------------- | --------------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| `/`                       | `AvulsaLayout`  | Sem sessão vai para `/entrar`. Uma escola abre `/{slug}`. Mais de uma lista as escolas | `App-Perfil-Escolha`                   |
| `/entrar`                 | `EntradaLayout` | Entrar sem escola (marca Recreio)                                                      | `Main`, `Celular-Entrar`               |
| `/esqueci-senha`          | `EntradaLayout` | Pedido do link de troca de senha                                                       | `Celular-Entrar` ("Recuperar a senha") |
| `/redefinir-senha?token=` | `EntradaLayout` | Senha nova pelo link do e-mail                                                         |                                        |
| `/sair`                   | `AvulsaLayout`  | Encerra a sessão e volta para `/entrar`                                                |                                        |
| `/preferencias`           | `AvulsaLayout`  | Acessibilidade e leitura (`PreferencesPanel`)                                          | `Familia-Preferencias`                 |
| `/sem-internet`           | `AvulsaLayout`  | O que funciona sem conexão                                                             | `Celular-Offline`                      |
| `/{slug}`                 | `AvulsaLayout`  | Um perfil abre a casca. Mais de um mostra a escolha. Sem vínculo, o aviso              | `App-Perfil-Escolha`                   |
| `/{slug}/entrar`          | `EntradaLayout` | Entrar com nome e cor da escola                                                        | `Main`, `Celular-Entrar`               |
| `/{slug}/sair`            | `AvulsaLayout`  | Encerra a sessão e volta para `/{slug}/entrar`                                         |                                        |
| `/{slug}/preferencias`    | `AvulsaLayout`  | Acessibilidade e leitura                                                               | `Familia-Preferencias`                 |
| `/{slug}/familia`         | `PerfilLayout`  | Hoje e mais 25 itens do menu, todos em construção                                      | `Familia-Hoje`, `Celular-Hoje`         |
| `/{slug}/aluno`           | `PerfilLayout`  | Hoje e mais 7 itens do menu, todos em construção                                       | `Aluno-Hoje`                           |
| `/{slug}/professor`       | `PerfilLayout`  | Início e mais 10 itens do menu, todos em construção                                    | `Professor-Inicio`                     |
| `/{slug}/escola`          | `PerfilLayout`  | Painel: unidades e alunos (`InicioPage`); outros 40 itens em construção                | `Escola-Painel`                        |
| `/{slug}/escola/alunos`   | `PerfilLayout`  | Alunos matriculados (`AlunosPage`)                                                     | `Escola-Alunos`                        |
| `/{slug}/<perfil>/mais`   | `PerfilLayout`  | Menu inteiro do perfil, aberto pelo "Mais" da barra inferior                           | `Celular-Mais`                         |
| `/{slug}/<perfil>/<item>` | `PerfilLayout`  | "Em construção" (`EmConstrucaoPage`) até a tela ser portada                            | O `.dc.html` do item                   |
| Qualquer outro endereço   | A do contexto   | Página não encontrada. Slug que não é de escola também                                 |                                        |

As rotas fixas (`entrar`, `sair`, `preferencias`, `sem-internet`, `esqueci-senha`, `redefinir-senha`) vencem o `:escola` no React Router, então não podem ser slug de escola.

Os itens de cada menu (rótulo, ícone, grupo e rota) estão em `src/shared/config/navigation/<perfil>.ts`, copiados do `renderVals()` da tela do protótipo, sem o slug. `navegacaoNaEscola` (`shared/layout/navegacao.ts`) põe o slug da rota na frente de cada link. O grupo "Conta" (Acessibilidade, Trocar perfil e Sair) vem de `comum.ts` e aparece nos 4 perfis.

### Guardas de sessão

`app/guardas.tsx` decide a tela pela sessão de `euQuery` (`shared/sessao`):

- `InicioGlobal` (`/`): sem sessão, `/entrar`. Uma escola, `/{slug}`. Várias ou nenhuma, a lista de escolas (`EscolhaEscolaPage`).
- `InicioDaEscola` (`/{slug}`): sem sessão, `/{slug}/entrar`. Sem vínculo, `SemAcessoPage` (ou página não encontrada, se o slug não existe). Um perfil, a casca dele. Mais de um, `EscolhaPerfilPage`.
- `ExigirPerfil` (cascas): sem sessão, `/{slug}/entrar?voltar=<caminho>`. Sem vínculo que libere a casca, `/{slug}`.
- Um 401 em qualquer consulta marca a sessão como `anonima`, e a casca leva para Entrar com o caminho de volta.
- `useEscolaDaRota()` devolve o slug. Toda chave de consulta e toda URL de `/api/v1/escolas/...` usam ele.

## Cascas

- `shared/layout/PerfilLayout.tsx`: `AppShell` com `SideNav` (todos os grupos do perfil) e `TabBar` (4 destinos e "Mais"). O CSS do `AppShell` troca um pelo outro abaixo de 860px. O item ativo é o de rota mais longa que casa com o endereço; fora dos 4 destinos, a barra inferior marca "Mais".
- `shared/layout/AvulsaLayout.tsx`: coluna centralizada de até 960px para as telas fora de um perfil.
- `pages/entrar/EntradaLayout.tsx`: `LoginLayout` do design system, com formulário de um lado e vitrine do Recreio do outro. Abaixo de 860px a vitrine some. Em `/{slug}/entrar` mostra nome e cidade de `/api/v1/escolas/{slug}/publica`.
- O rodapé do menu lateral tem o `ProfileSwitcher`: nome da pessoa, troca de perfil sem novo login e "Sair".
- As duas cascas mostram `AvisoSemInternet` no topo quando o navegador fica sem conexão.
- As duas cascas põem a página dentro de `ConteudoDaRota` (`shared/layout`): um `Suspense` com `LoadingCard` enquanto o arquivo da página baixa.

## Páginas sob demanda e arquivos do build

`app/router.tsx` carrega cada página com `sobDemanda`, um `React.lazy` que aceita export nomeado. Cada página vira um arquivo JS próprio e só baixa quando a rota abre. A navegação do React Router roda em transição, então a tela anterior fica visível até a nova chegar. O `LoadingCard` aparece só na primeira carga.

`SemInternetPage` é a exceção e fica no arquivo principal. Sem conexão e sem service worker, um arquivo sob demanda não baixa.

O `vite.config.ts` separa as bibliotecas em arquivos próprios (`build.rolldownOptions.output.codeSplitting.groups`). Elas mudam menos que o portal, então ficam no cache do navegador entre deploys.

| Arquivo              | Conteúdo                                                                    | Tamanho (min / gzip) |
| -------------------- | --------------------------------------------------------------------------- | -------------------- |
| `index-*.js`         | Entrada: rotas, cascas, provedores, `SemInternetPage`                       | 34 kB / 12 kB        |
| `react-*.js`         | `react`, `react-dom`, `scheduler`                                           | 218 kB / 68 kB       |
| `design-system-*.js` | Arquivos do design system usados por 2 ou mais partes (inclui os logos)     | 139 kB / 88 kB       |
| `router-*.js`        | `react-router`                                                              | 95 kB / 31 kB        |
| `zod-*.js`           | `zod`, usado pelos contratos                                                | 89 kB / 25 kB        |
| `query-*.js`         | TanStack Query                                                              | 33 kB / 10 kB        |
| `<Pagina>-*.js`      | Uma página. A maior é `PreferenciasPage` (17 kB), com o `PreferencesPanel`. | 0,5 a 17 kB          |

Antes da divisão, o arquivo principal tinha 629 kB e o Vite avisava do limite de 500 kB. O design system declara `"sideEffects": ["*.css"]` no `package.json`. Sem isso, o barril `index.ts` puxava todos os componentes para o arquivo principal.

## Adicionar uma tela

1. Crie a consulta e os componentes em `features/<dominio>` (veja [CONTRIBUTING.md](../CONTRIBUTING.md)).
2. Crie a página em `pages/<pagina>/<Pagina>Page.tsx`. Use `QueryState` de `shared/ui` para carregando, vazio e erro.
3. Se o item já existe no menu do perfil, declare a página com `sobDemanda` em `app/router.tsx` e registre-a em `TELAS_PRONTAS`, pelo `href` do item. A rota passa a abrir a tela no lugar de "Em construção".
4. Se o item não existe, acrescente-o em `shared/config/navigation/<perfil>.ts` e faça o passo 3. Para ir à barra inferior do celular, coloque o id em `barraInferior` (no máximo 4).
5. Teste a página com `renderRoute(naEscola('/<perfil>/<item>'))`, `mockApi` e `comSessao([...perfis])` de `src/test/render.tsx`. A página chega sob demanda, então use `findBy...` na primeira busca.
6. Se a tela tem fluxo próprio, acrescente um teste em `apps/web/e2e/` com os dados em `e2e/dados.ts` (veja [Testes no navegador](#testes-no-navegador)).

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

- Manifesto global em português, com `scope` e `start_url` em `/`: vale para todas as rotas `/{slug}/...`. O manifesto por escola (nome, cor e ícone da escola, `scope` `/{slug}/`) da ADR 0011 ainda não existe.
- Nome "Recreio", `lang: pt-BR`, `display: standalone`. `theme_color` e `background_color` são lidos de `tokens.css` (`--brand` e `--surface-0`) no build, e a mesma cor vai para a `<meta name="theme-color">`.
- Ícones em `apps/web/public/icons/`: 192, 512, maskable 512 (símbolo em 80% do quadro) e `apple-touch-icon` 180. Eles saem de `packages/design-system/assets/recreio-icone-app.png` por `npm run icones -w @recreio/web`. Os PNGs ficam no repositório; rode o script só quando o ícone mudar.
- Cache: JS, CSS, HTML e ícones entram no precache, inclusive o arquivo de cada página sob demanda. Toda navegação abre o `index.html` salvo, então o portal abre sem conexão e o React Router mostra a tela. `e2e/pwa.spec.ts` confere isso a cada pull request.
- `/api/` é sempre `NetworkOnly` e fica fora do fallback de navegação. Dado da escola nunca vem do cache do service worker; sem conexão, a tela mostra o `ErrorState` de offline e a faixa "Sem internet" leva a `/sem-internet`. A casca abre sem conexão com a última sessão salva no navegador (`recreio.sessao`, só nome, e-mail, escolas e perfis).
- O service worker não roda em `npm run dev`. Para testar, use `npm run build -w @recreio/web` e `npm run preview -w @recreio/web`.

### Fluxo de atualização

`registerType: 'prompt'`: a versão nova fica esperando até a pessoa aceitar.

1. Um deploy publica `sw.js` novo. O navegador baixa e instala em segundo plano.
2. `AvisoDeAtualizacao` (montado em `main.tsx`) recebe `needRefresh` do `useRegisterSW` e mostra um toast do design system: "Versão nova do portal", com o botão "Atualizar agora". O toast não some sozinho.
3. "Atualizar agora" chama `updateServiceWorker(true)`: o service worker novo assume e a página recarrega. Quem fecha o toast continua na versão atual até a próxima visita.

## Tema da escola

`useEscolaTema(slug)` (`features/escola`) lê `corMarca` de `escolaPublicaQuery(slug)` e entrega a cor ao `seed` do `RecreioProvider` em `app/providers.tsx`. Os provedores ficam fora do `RouterProvider`, então leem o slug das rotas casadas do router. Fora de `/{slug}` vale o azul Recreio. O `SchoolTheme` do design system deriva a paleta da cor. Enquanto a escola carrega, ou se a API falha, vale o azul Recreio `#0067CC`.

## Acessibilidade

- `/preferencias` usa o `PreferencesPanel`: tema (claro, escuro, alto contraste), tamanho do texto até 200%, espaçamento, fonte legível, leitura simples, movimento reduzido e modo foco. A prévia muda na hora.
- "Salvar preferências" grava em `localStorage` (`recreio.preferencias`), validado com Zod ao ler. O `RecreioProvider` começa com essas preferências na próxima visita. O painel diz "Salvo neste aparelho" (prop `savedIn`, padrão `device`). Gravar na conta ainda não existe; quando existir, a página passa `savedIn="account"`.
- O menu lateral e a barra inferior usam `aria-current="page"` no item ativo. As listas de links têm rótulo próprio para leitor de tela.

## Storybook

```bash
npm run storybook          # Storybook do design system em http://localhost:6006
npm run build-storybook    # gera packages/design-system/storybook-static
```

- Configuração em `packages/design-system/.storybook`: `main.ts` (framework `@storybook/react-vite`, addon de acessibilidade) e `preview.tsx` (importa `tokens.css` e `recreio.css` e envolve cada história no `RecreioProvider`).
- A barra de ferramentas troca o tema (4 modos) e a cor da escola, para conferir contraste e marca em cada componente.
- Histórias em `packages/design-system/stories/` para Button, Alert, Card, StatCard, DataTable, EmptyState, SideNav e TabBar. Os dados vêm de `prototipo/docs/dados-canonicos.md` (`stories/dados.ts`).
- O painel Accessibility roda o axe em cada história; violação aparece como erro. O número ao lado de "Accessibility" soma violações e itens "Inconclusive". O menu lateral (`SideNav`) mostra 1 inconclusivo de contraste: o axe não calcula a cor sobre o gradiente do menu. Isso pede conferência manual e não reprova o CI.
- `storybook-static/` fica fora do Git, do ESLint e do Prettier.

### Acessibilidade do Storybook no CI

```bash
npm run test:storybook     # gera o Storybook e passa o axe em cada história
```

`packages/design-system/a11y/historias.spec.ts` lê `storybook-static/index.json` e abre cada história no `iframe.html` com o Playwright. O axe roda com o mesmo alcance do addon: o `body` sem os elementos do Storybook, sem a regra `region`. Como o preview usa `a11y: { test: 'error' }`, qualquer violação reprova. O Storybook estático é servido por `vite preview` na porta 6106.

Opções descartadas:

- `@storybook/test-runner`: roda em Jest 30, um segundo executor de testes no repositório só para isso.
- `@storybook/addon-vitest`: aceita Storybook 10 e Vitest 5, mas pede `@vitest/browser`, `@vitest/browser-playwright` e um projeto do Vitest em modo navegador ao lado do jsdom. Ele também testa o código-fonte, sem passar pelo Storybook gerado.

O Playwright já entra no e2e do portal. O teste do Storybook usa o mesmo pacote e o mesmo `@axe-core/playwright`, e confere o Storybook que o build gera.

## Testes no navegador

| Comando                   | O que roda                                                                                                   | Porta |
| ------------------------- | ------------------------------------------------------------------------------------------------------------ | ----- |
| `npm run test:e2e`        | Build do portal, `vite preview` e os testes de `apps/web/e2e` no Chromium                                    | 4273  |
| `npm run test:storybook`  | Build do Storybook e axe em cada história                                                                    | 6106  |
| `npm run test:lighthouse` | Build do portal, `vite preview` e o Lighthouse em `/`, `/colegio-recreio/escola` e `/colegio-recreio/entrar` | 4274  |

Na primeira vez, baixe o Chromium do Playwright: `npx playwright install chromium` (no Linux, `npx playwright install --with-deps chromium`). O Lighthouse usa o Chrome instalado no computador.

Saídas, todas fora do Git: `apps/web/test-results/` e `apps/web/playwright-report/` (e2e), as mesmas pastas em `packages/design-system/` (Storybook) e `apps/web/.lighthouseci/` (relatórios HTML do Lighthouse).

### E2E com Playwright

- Roda contra o build de produção, com service worker, divisão de arquivos e CSS de verdade.
- A API vem do `page.route` em `e2e/fixtures.ts`: toda chamada a `/api/` recebe a resposta de `e2e/dados.ts`, e caminho fora da lista recebe 404 no formato RFC 9457. Um `page.route` no próprio teste tem prioridade, como o 503 de `escola.spec.ts`.
- `e2e/dados.ts` traz a sessão de demonstração (`/api/v1/eu` com os 4 perfis no Colégio Recreio) e passa as respostas pelos schemas de `@recreio/contracts`. Quando o contrato muda, o teste para ali com o campo errado, antes de abrir o navegador.
- O service worker fica bloqueado (`serviceWorkers: 'block'`), porque o `page.route` não vê o que passa por ele. Só `pwa.spec.ts` liga o service worker. Ali a API vem do `vite preview --mode api-falsa` (`e2e/api-falsa.ts`), que responde `/api/*` com os mesmos dados.

| Arquivo                  | O que confere                                                                                                        |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- |
| `perfis.spec.ts`         | `/` abre a escola e a escolha de perfil, casca de cada perfil com o item de entrada ativo, barra inferior no celular |
| `entrar.spec.ts`         | Casca sem sessão leva a `/{slug}/entrar` com o caminho de volta, senha errada, login certo volta para a tela         |
| `escola.spec.ts`         | `/{slug}/escola` com unidades e alunos da API simulada; erro e "Tentar de novo" com a API fora do ar                 |
| `sem-internet.spec.ts`   | Faixa "Sem internet" ao perder a conexão e a tela `/sem-internet` nos 2 estados                                      |
| `nao-encontrada.spec.ts` | Página não encontrada para slug desconhecido e dentro de um perfil                                                   |
| `pwa.spec.ts`            | Manifesto (nome, idioma, ícones 192, 512 e maskable), service worker no controle, abrir sem rede                     |

### Axe nas telas

`e2e/axe.ts` (`esperarSemViolacoesGraves`) roda o axe com as regras WCAG 2.1 A e AA na página inteira. Violação `serious` ou `critical` reprova. `moderate` e `minor` ficam de fora. Antes, a função espera as animações de entrada terminarem: no meio do fade, o texto ainda está claro e o axe acusaria contraste. Todos os testes de tela, menos os de PWA, chamam a função.

### Lighthouse CI

`apps/web/lighthouserc.json` sobe `vite preview --mode api-falsa` na porta 4274 e roda o Lighthouse 13 uma vez em `/`, `/colegio-recreio/escola` e `/colegio-recreio/entrar`, com perfil de celular. As notas abaixo são de antes das rotas por escola.

- Reprova com acessibilidade ou boas práticas abaixo de 0,9.
- Desempenho e SEO saem no relatório, sem bloquear.
- O Lighthouse 12 tirou a categoria PWA. Manifesto, service worker e abrir sem conexão passaram para `e2e/pwa.spec.ts`.

Notas de 27/11/2026, na máquina de desenvolvimento:

| Página    | Acessibilidade | Boas práticas | Desempenho | SEO  |
| --------- | -------------- | ------------- | ---------- | ---- |
| `/`       | 0,98           | 1,00          | 0,83       | 0,83 |
| `/escola` | 0,98           | 1,00          | 0,84       | 0,73 |

Os 0,02 que faltam em acessibilidade vêm de `heading-order` (título que pula nível). Em SEO faltam `meta description`, `robots.txt` e, em `/escola`, texto de link descritivo.
