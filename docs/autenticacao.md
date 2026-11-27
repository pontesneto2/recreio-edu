# Autenticação e permissões

O login usa Better Auth com e-mail e senha e sessão em cookie ([ADR 0007](adr/0007-autenticacao-better-auth.md)). Um login vale para todas as escolas do domínio `recreio-edu.com.br`. A escola vem do primeiro trecho do caminho ([ADR 0011](adr/0011-escola-pela-rota.md)): `/colegio-recreio/...` no portal e `/api/v1/escolas/colegio-recreio/...` na API. O acesso a uma escola vem dos vínculos da conta com ela, e cada perfil do vínculo libera ações por módulo.

## Peças

| Peça                                                 | Onde                                                     | O que faz                                                           |
| ---------------------------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------- |
| Better Auth                                          | `apps/api/src/modules/autenticacao/auth.ts`              | Rotas `/api/auth/*`: entrar, sair, cadastro, e-mail, troca de senha |
| Tabelas `user`, `session`, `account`, `verification` | `apps/api/src/database/schema/autenticacao.ts`           | Contas e sessões. Globais, sem `escola_id` e sem RLS                |
| Tabela `vinculos`                                    | `apps/api/src/database/schema/vinculos.ts`               | Conta, escola e perfil. Uma linha por perfil                        |
| Tabela `permissoes`                                  | `apps/api/src/database/schema/permissoes.ts`             | Ações de cada perfil em cada módulo, por escola                     |
| `exigirLogin`, `exigirSessao`, `exigirPermissao`     | `apps/api/src/modules/autenticacao/acesso.middleware.ts` | Middlewares da v1: 401, 403 `SEM_ACESSO` e 403 `PERMISSAO_NEGADA`   |
| `GET /api/v1/eu`                                     | `apps/api/src/modules/autenticacao/eu.routes.ts`         | Pessoa logada e vínculos em todas as escolas                        |
| `euQuery`, `useSessao`                               | `apps/web/src/shared/sessao/`                            | Sessão no portal (TanStack Query)                                   |
| `InicioGlobal`, `InicioDaEscola`, `ExigirPerfil`     | `apps/web/src/app/guardas.tsx`                           | Guardas das rotas do portal                                         |

`vinculos` e `permissoes` têm `ENABLE` e `FORCE ROW LEVEL SECURITY`, como as outras tabelas da escola ([banco-de-dados.md](banco-de-dados.md)). As tabelas do Better Auth ficam fora do RLS porque o Better Auth consulta fora de `withEscola`. A migração `0003_rls_vinculos_e_permissoes.sql` dá `GRANT` nas 6 tabelas para `recreio_app`.

`GET /api/v1/eu` lê vínculos de todas as escolas, o que o RLS de `vinculos` não deixa `recreio_app` fazer. A leitura passa pela função `vinculos_do_usuario(usuario_id)` (`SECURITY DEFINER`, dono `recreio`), que devolve só slug, nome da escola e perfil. Uma política só de `SELECT` em `vinculos` libera a leitura para o dono.

## Fluxos

### Entrar

1. A pessoa abre `/colegio-recreio/entrar` (ou `/entrar`, sem escola). Nome, cidade e cor vêm de `GET /api/v1/escolas/colegio-recreio/publica`, que responde sem login.
2. O formulário chama `POST /api/auth/sign-in/email` com `{ email, password }` e `credentials: 'include'`.
3. O Better Auth confere a senha (scrypt) e responde com `Set-Cookie: recreio.session_token=...`.
4. O portal limpa o cache do TanStack Query e vai para o `?voltar=` da URL, ou para a entrada da escola (`/colegio-recreio`), ou para `/`.
5. `/` sem sessão vai para `/entrar`. Com uma escola abre `/{slug}`. Com mais de uma lista as escolas da conta.
6. `/{slug}` com um perfil abre a casca dele. Com mais de um mostra a escolha (`App-Perfil-Escolha`). Sem vínculo com a escola, mostra o aviso e o botão de sair.

Erros do Better Auth chegam como `{ code, message }`. O portal mostra a mensagem pelo `code`: `INVALID_EMAIL_OR_PASSWORD`, `EMAIL_NOT_VERIFIED` e `LIMITE_EXCEDIDO`.

### Sessão nas rotas da v1

```
/api/v1/escolas/:escola ─> resolverEscola ─> exigirSessao ─> exigirPermissao(modulo, acao) ─> controller
                           404 sem escola     401 sem sessão    403 PERMISSAO_NEGADA
                                              403 SEM_ACESSO
```

- `exigirLogin` lê o cookie com `auth.api.getSession`. Sem sessão válida responde 401 `NAO_AUTENTICADO`. Só `/eu` usa ele sozinho.
- `exigirSessao` faz o mesmo e busca os perfis da conta na escola da rota, dentro de `withEscola`. Sem nenhum, responde 403 `SEM_ACESSO`.
- `exigirPermissao` faz o mesmo e depois procura em `permissoes` uma linha de algum dos perfis com o módulo e a ação. Sem ela, responde 403 `PERMISSAO_NEGADA`.
- O resultado fica em `res.locals`. A sessão é lida uma vez por requisição, mesmo com mais de um middleware na rota.
- Ter sessão não dá acesso a outra escola: cada requisição confere o vínculo com a escola do slug.

### Sair

O item "Sair" do menu, o "Sair" do seletor de perfil e o da escolha de perfil abrem `/{slug}/sair`. A página chama `POST /api/auth/sign-out`, limpa o cache e a sessão salva e vai para `/{slug}/entrar`. `/sair`, sem escola, volta para `/entrar`.

### Sessão expirada no portal

Um 401 em qualquer consulta marca a sessão como `anonima` no cache (`shared/api/query-client.ts`). A casca do perfil vê a mudança e leva para `/{slug}/entrar?voltar=<caminho atual>`. O `voltar` só aceita caminho interno: `//outro.site` e URL completa caem na entrada da escola.

### Sem conexão

A última resposta de `/api/v1/eu` fica em `localStorage` (`recreio.sessao`), para a casca do PWA abrir sem conexão. Ela guarda nome, e-mail, escolas e perfis, nunca credencial. Sair e um 401 apagam o valor. Com conexão, o portal sempre usa a resposta da API.

### Confirmação de e-mail

- O cadastro (`POST /api/auth/sign-up/email`) põe na fila `emails` o modelo `confirmacao-email`, com o link `/api/auth/verify-email?token=...`. Sem confirmar, entrar responde 403 `EMAIL_NOT_VERIFIED` e põe um link novo na fila.
- O link confirma, abre a sessão e leva para `/`. Ele vale por 24 horas.
- Cadastro pela própria pessoa só existe fora de produção. Em produção as contas nascem pelo convite da escola, que ainda não existe.
- Conta nova não tem vínculo. `/api/v1/eu` devolve `escolas: []` e as rotas da escola respondem 403 `SEM_ACESSO` até a escola dar um perfil.

### Troca de senha

1. `/esqueci-senha` chama `POST /api/auth/request-password-reset` com `{ email }`. A resposta é a mesma com e sem conta cadastrada.
2. A fila `emails` recebe o modelo `troca-de-senha` com o link `<origem>/redefinir-senha?token=...`. O link vale por 30 minutos e funciona uma vez.
3. `/redefinir-senha` chama `POST /api/auth/reset-password` com `{ token, newPassword }`.
4. A troca encerra as outras sessões da conta.

A origem do link é o `Origin` da requisição quando ele está em `AUTH_TRUSTED_ORIGINS`. Qualquer outro valor usa `AUTH_URL`, então um `Origin` forjado não leva o link para outro site. `/esqueci-senha` e `/redefinir-senha` ficam fora de `/{slug}`, porque a conta é global.

Os e-mails saem pelo worker (`npm run dev:worker`, já incluído no `npm run dev`), que lê a fila `emails` no Redis ([operacao/filas.md](operacao/filas.md)). A chave de cada tarefa leva o modelo, a conta e o token, então reenviar o mesmo pedido não duplica o e-mail.

## Cookie

| Atributo | Valor                                                                              |
| -------- | ---------------------------------------------------------------------------------- |
| Nome     | `recreio.session_token`. Em produção, `__Secure-recreio.session_token`             |
| HttpOnly | Sempre. O JavaScript do portal não lê o cookie                                     |
| Secure   | Em produção (`NODE_ENV=production`). Fora dela o cookie vale em `http://localhost` |
| SameSite | `Lax`                                                                              |
| Domínio  | O do portal (`recreio-edu.com.br`). Um cookie só atende todas as escolas           |
| Validade | 7 dias, renovada a cada dia de uso                                                 |

Nenhum token fica em `localStorage`. O portal e a API ficam na mesma origem (o Vite e o nginx repassam `/api`), então o navegador envia o cookie sem configuração de CORS.

## Proteções

- Senha com 10 a 128 caracteres.
- `AUTH_RATE_LIMIT_PER_MINUTE` (padrão 10) tentativas por minuto por IP em entrar, cadastrar, pedir troca de senha, trocar a senha e reenviar confirmação. Acima disso, 429 `LIMITE_EXCEDIDO`. O limite usa `req.ip`, que respeita `TRUST_PROXY`.
- O Better Auth confere o `Origin` das requisições com cookie contra `AUTH_TRUSTED_ORIGINS` (proteção contra CSRF).
- O limitador próprio do Better Auth fica desligado. O do Express responde no mesmo problem+json do resto da API.

## Perfis

| Perfil do vínculo | Casca do portal     | Quem                               |
| ----------------- | ------------------- | ---------------------------------- |
| `responsavel`     | `/{slug}/familia`   | Mãe, pai ou responsável financeiro |
| `aluno`           | `/{slug}/aluno`     | Aluno                              |
| `professor`       | `/{slug}/professor` | Professor titular                  |
| `secretaria`      | `/{slug}/escola`    | Secretaria escolar                 |
| `financeiro`      | `/{slug}/escola`    | Financeiro                         |
| `portaria`        | `/{slug}/escola`    | Portaria e recepção                |
| `coordenacao`     | `/{slug}/escola`    | Coordenação pedagógica             |
| `direcao`         | `/{slug}/escola`    | Direção                            |

Os 5 perfis da equipe dividem a casca `/escola`. Quem tem `secretaria` e `financeiro` vê uma casca só e entra direto. A tabela fica em `apps/web/src/shared/sessao/perfis.ts`.

## Matriz padrão de permissões

O seed grava esta matriz em toda escola (`apps/api/src/database/seed/permissoes-padrao.ts`). A fonte é a tela `Escola-Permissoes`. A ação `exportar` do protótipo fica de fora até existir exportação.

Legenda: V ver, C criar, E editar, X excluir, A aprovar.

| Módulo         | Direção | Coordenação | Professor | Secretaria | Financeiro | Portaria | Responsável | Aluno |
| -------------- | ------- | ----------- | --------- | ---------- | ---------- | -------- | ----------- | ----- |
| painel         | VCEXA   | V           |           |            |            |          |             |       |
| comunicados    | VCEXA   | VCEA        | VC        | VC         | V          | V        | V           | V     |
| chat           | VCEXA   | VCE         |           |            |            |          | VC          |       |
| notas          | VCEXA   | VEA         | VCE       |            |            |          |             | V     |
| chamada        | VCEXA   | VE          | VCE       |            |            |          |             |       |
| agenda         | VCEXA   | VCEA        | VCE       |            |            |          | V           | V     |
| frequencia     | VCEXA   | VEA         | V         |            |            |          | V           |       |
| boletins       | VCEXA   | VCEA        |           |            |            |          | V           | V     |
| ocorrencias    | VCEXA   | VCEXA       | VC        |            |            |          |             |       |
| integral       | VCEXA   | V           |           |            |            |          |             |       |
| horarios       | VCEXA   |             | V         |            |            |          |             | V     |
| saude          | VCEXA   | V           |           |            |            |          |             |       |
| inclusao       | VCEXA   | VEA         |           |            |            |          |             |       |
| alunos         | VCEXA   | V           |           | VCE        | V          |          |             |       |
| captacao       | VCEXA   |             |           | VCEXA      |            |          |             |       |
| matriculas     | VCEXA   |             |           | VCEXA      |            |          |             |       |
| contratos      | VCEXA   |             |           | VCE        | V          |          |             |       |
| autorizacoes   | VCEXA   | VCE         |           | VCE        |            | V        | VA          |       |
| portaria       | VCEXA   | VEA         |           | V          |            | VCE      |             |       |
| biblioteca     | VCEXA   | VEA         |           |            |            |          |             | V     |
| certificados   | VCEXA   | VA          |           | VCE        |            |          |             |       |
| transferencias | VCEXA   |             |           | VCE        |            |          |             |       |
| fotos          | VCEXA   |             |           | VCE        |            |          |             |       |
| importacao     | VCEXA   |             |           | VC         |            |          |             |       |
| medidas        | VCEXA   | VCEXA       |           |            |            |          |             |       |
| extras         | VCEXA   | VCEA        |           |            |            |          |             |       |
| eja            | VCEXA   | VCE         |           |            |            |          |             |       |
| dae            | VCEXA   |             |           |            | VCEXA      |          |             |       |
| calendario     | VCEXA   |             |           |            |            |          | V           | V     |
| atendimentos   | VCEXA   |             | VCE       |            |            |          | VC          |       |
| cardapio       | VCEXA   |             |           |            |            |          | V           | V     |
| galeria        | VCEXA   |             |           |            |            |          | V           |       |
| mensalidades   | VCEXA   |             |           |            | VCEXA      |          | V           |       |
| fiscal         | VCEXA   |             |           |            | VCEXA      |          |             |       |
| caixa          | VCEXA   |             |           |            | VCE        |          |             |       |
| relatorios     | VCEXA   | V           |           |            |            |          |             |       |

A direção tem as 5 ações também em `equipe`, `solicitacoes`, `loja`, `pesquisas`, `permissoes` e `modulos`. A lista completa de módulos fica em `MODULOS` de `packages/contracts/src/acesso.ts`.

Responsável e aluno não aparecem na matriz do protótipo. Eles recebem só os módulos das telas da família e do aluno. O alcance (só os próprios filhos, só as próprias turmas) é regra de cada módulo, não desta tabela.

## Rotas protegidas hoje

| Rota                                          | Proteção                           | Motivo                                                     |
| --------------------------------------------- | ---------------------------------- | ---------------------------------------------------------- |
| `GET /api/v1/escolas/:escola/publica`         | Nenhuma                            | A tela de entrada mostra nome, cidade e cor antes do login |
| `GET /api/v1/eu`                              | `exigirLogin`                      | A pessoa lê os próprios dados e vínculos                   |
| `GET /api/v1/escolas/:escola`                 | `exigirPermissao('painel', 'ver')` | CNPJ e alunos por unidade são dados do painel              |
| `GET /api/v1/escolas/:escola/alunos` e `/:id` | `exigirPermissao('alunos', 'ver')` | Lista nominal de alunos                                    |

Os dados da escola ficaram em 2 rotas porque a tela de entrada precisa da marca da escola sem sessão. A parte pública tem só slug, nome, cidade e cor. O resto exige `painel:ver`, que a matriz dá à direção e à coordenação.

## Proteger uma rota nova

1. Escolha o módulo em `MODULOS` (`packages/contracts/src/acesso.ts`). Módulo novo entra lá e na matriz de `permissoes-padrao.ts`.
2. No router do módulo, receba `acesso: AcessoMiddlewares` e aplique a permissão antes do controller:

   ```ts
   export const createTurmasRouter = (service: TurmasService, acesso: AcessoMiddlewares) => {
     const controller = createTurmasController(service);
     return Router()
       .get('/', acesso.exigirPermissao('horarios', 'ver'), controller.listar)
       .post('/', acesso.exigirPermissao('horarios', 'criar'), controller.criar);
   };
   ```

   Rota que só precisa de vínculo com a escola usa `acesso.exigirSessao`. Rota pública não leva nenhum dos 2.

3. Em `app.ts`, monte o router em `daEscola` (o router de `/escolas/:escola`, depois do `resolverEscola`), passando `container.autenticacao.acesso`.
4. No controller, `acessoDaRequisicao(res)` devolve `{ usuario, perfis }`.
5. No `<dominio>.openapi.ts`, declare `security: SESSAO_EXIGIDA`, `requestParams: { path: escolaParamsSchema }`, `401: problemResponse('NAO_AUTENTICADO')` e `403: acessoNegadoResponse`.
6. Teste com `entrar(baseUrl, email)` e `rotaDaEscola('/turmas')` de `apps/api/src/test/sessao.ts`: um perfil com a permissão recebe 200 e um sem ela recebe 403.

No portal, as telas da casca já exigem sessão. A consulta usa o slug da rota (`useEscolaDaRota()`) na URL e na chave. Um 403 `PERMISSAO_NEGADA` aparece como "Seu perfil não vê esta informação".

## Contas de demonstração (só desenvolvimento)

`npm run db:seed` grava 8 contas com e-mail confirmado no Colégio Recreio (`colegio-recreio`). A senha de todas é `SEED_SENHA_PADRAO` de `apps/api/.env.example`: `recreio-demo-2026`. O seed não roda com `NODE_ENV=production`, e sem `SEED_SENHA_PADRAO` ele grava a escola sem as contas. Entre em http://localhost:5173/colegio-recreio/entrar.

| Pessoa              | E-mail                                    | Perfil        | Abre em                      |
| ------------------- | ----------------------------------------- | ------------- | ---------------------------- |
| Fernanda Lima       | `fernanda.lima@colegiorecreio.test`       | `responsavel` | `/colegio-recreio/familia`   |
| Ana Beatriz Lima    | `ana.beatriz.lima@colegiorecreio.test`    | `aluno`       | `/colegio-recreio/aluno`     |
| Ricardo Albuquerque | `ricardo.albuquerque@colegiorecreio.test` | `professor`   | `/colegio-recreio/professor` |
| Renata Alencar      | `renata.alencar@colegiorecreio.test`      | `secretaria`  | `/colegio-recreio/escola`    |
| Paulo Ribeiro       | `paulo.ribeiro@colegiorecreio.test`       | `financeiro`  | `/colegio-recreio/escola`    |
| Francisco Araújo    | `francisco.araujo@colegiorecreio.test`    | `portaria`    | `/colegio-recreio/escola`    |
| Juliana Sampaio     | `juliana.sampaio@colegiorecreio.test`     | `coordenacao` | `/colegio-recreio/escola`    |
| Lúcia Menezes       | `lucia.menezes@colegiorecreio.test`       | `direcao`     | `/colegio-recreio/escola`    |

O domínio `.test` é reservado e nunca entrega e-mail para fora. Para ver a escolha de perfil, dê um segundo vínculo a uma conta:

```sql
-- psql como recreio, no banco de desenvolvimento
begin;
select set_config('app.escola_id', (select id::text from escolas where slug = 'colegio-recreio'), true);
insert into vinculos (escola_id, usuario_id, perfil)
select current_setting('app.escola_id')::uuid, id, 'professor' from "user" where email = 'fernanda.lima@colegiorecreio.test';
commit;
```

## E-mail no desenvolvimento

A API põe os e-mails de conta na fila `emails`. O worker envia para `SMTP_URL` (padrão `smtp://localhost:1025`, o Mailpit do `docker-compose.yml`). As mensagens aparecem em http://localhost:8025.

1. Rode `npm run dev`, que sobe a API, o worker e o portal.
2. Em http://localhost:5173/esqueci-senha, peça o link para `fernanda.lima@colegiorecreio.test`.
3. Abra http://localhost:8025 e clique no link da mensagem "Troca de senha do portal da escola".
4. Crie a senha nova. Rode `npm run db:seed` para voltar à senha padrão.

Os testes da API trocam as filas por uma lista em memória (`createFilasEmMemoria` de `apps/api/src/test/sessao.ts`) e leem o link de lá.

## Variáveis

| Variável                     | Padrão                  | Uso                                                                 |
| ---------------------------- | ----------------------- | ------------------------------------------------------------------- |
| `AUTH_SECRET`                | Valor local fixo        | Assina cookies e tokens. Obrigatória em produção, 32+ caracteres    |
| `AUTH_URL`                   | `http://localhost:5173` | Origem dos links dos e-mails quando o `Origin` não é confiável      |
| `AUTH_TRUSTED_ORIGINS`       | `http://localhost:5173` | Origens aceitas, por vírgula. Aceita `https://*.recreio-edu.com.br` |
| `AUTH_RATE_LIMIT_PER_MINUTE` | `10`                    | Tentativas por minuto por IP nas rotas de entrada                   |
| `SEED_SENHA_PADRAO`          | Vazia                   | Senha das contas de demonstração do seed                            |

O remetente e o servidor dos e-mails vêm de `EMAIL_FROM` e `SMTP_URL` ([operacao/README.md](operacao/README.md)).

## Rotas do Better Auth

As rotas `/api/auth/*` ficam fora do `openapi.json` da v1. A referência delas está na [documentação do Better Auth](https://www.better-auth.com/docs/concepts/api). As usadas hoje:

| Rota                                    | Uso                                         |
| --------------------------------------- | ------------------------------------------- |
| `POST /api/auth/sign-in/email`          | Entrar com `{ email, password }`            |
| `POST /api/auth/sign-out`               | Sair                                        |
| `POST /api/auth/sign-up/email`          | Cadastro, só fora de produção               |
| `GET /api/auth/verify-email`            | Link de confirmação do e-mail               |
| `POST /api/auth/request-password-reset` | Pedir o link de troca de senha              |
| `POST /api/auth/reset-password`         | Trocar a senha com `{ token, newPassword }` |
| `GET /api/auth/get-session`             | Sessão atual, sem os vínculos               |
