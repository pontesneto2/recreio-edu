# Roadmap de implementação

Plano para levar as 173 telas do protótipo a um produto em produção. A ordem segue dependências: plataforma antes de tela, cadastro antes de pedagógico, pedagógico antes de financeiro. Cada fase termina com algo implantado em staging e testado por alguém da escola.

## Premissas

- O produto é white label e multi-escola: cada escola tem unidades, cor, logo e vocabulário próprios (`prototipo/design-system/README.md`).
- Os dados são de menores de idade, o que torna a LGPD um requisito de projeto desde a fase 1.
- A web (PWA) vem primeiro. O app nativo cobre só push, câmera, QR, biometria e uso rápido (`prototipo/LEIA-ME.md`).
- Toda decisão marcada "ADR" vira um arquivo em `docs/adr` antes do código.

## Visão geral

| Fase | Entrega                                 | Telas do protótipo | Depende de |
| ---- | --------------------------------------- | ------------------ | ---------- |
| 0    | Fundação do repositório                 | 0                  |            |
| 1    | Plataforma: banco, autenticação, deploy | 2                  | 0          |
| 2    | Casca do portal por perfil e PWA        | 7                  | 1          |
| 3    | Cadastro escolar (secretaria)           | 14                 | 2          |
| 4    | Pedagógico: chamada, notas, tarefas     | 36                 | 3          |
| 5    | Comunicação com a família               | 26                 | 3          |
| 6    | Financeiro e matrícula                  | 20                 | 3          |
| 7    | Operação escolar                        | 30                 | 3          |
| 8    | App nativo                              | 38                 | 4, 5, 6    |
| 9    | Escala, segurança e operação contínua   | 0                  | 1          |

As fases 4, 5, 6 e 7 podem andar em paralelo com equipes separadas, porque cada uma é um módulo na API e uma feature no portal.

## Fase 0. Fundação do repositório (concluída)

- Monorepo com npm workspaces: `apps/web`, `apps/api`, `packages/contracts`, `packages/design-system`.
- TypeScript strict em todo o código, Node 24 rodando `.ts` direto.
- API em camadas por módulo e portal organizado por feature ([arquitetura.md](arquitetura.md)).
- Contratos Zod compartilhados entre API e portal.
- CI no GitHub Actions: formatação, lint, typecheck, testes e build.
- Husky, lint-staged e commitlint com Conventional Commits.
- Dependabot e 4 ADRs.

Pendente nesta fase:

- Regra de proteção da `main`: bloquear force push e exclusão, exigir CI verde no merge.
- [x] Corrigir os 24 avisos do React Compiler no design system, componente por componente.

## Fase 1. Plataforma

Objetivo: qualquer funcionalidade nova já nasce com banco, login, permissão, log e deploy.

### Banco de dados

- [x] PostgreSQL 17 local via Docker Compose.
- [ ] PostgreSQL 17 gerenciado em produção.
- [x] ORM com migrações versionadas: Drizzle ORM com drizzle-kit (ADR 0005).
- [x] Multi-tenant por coluna `escola_id` em toda tabela, com Row Level Security do Postgres como segunda barreira (ADR 0006).
- [x] Repositórios Drizzle no lugar dos repositórios em memória. Os services recebem o contexto da escola.
- [x] Seed com os dados canônicos de `prototipo/docs/dados-canonicos.md`.

Detalhes em [banco-de-dados.md](banco-de-dados.md).

### Autenticação e autorização

Detalhes em [autenticacao.md](autenticacao.md).

- [x] Login com sessão em cookie `httpOnly`, `Secure` em produção, `SameSite=Lax`: Better Auth com adaptador Drizzle (ADR 0007). Senha com 10 caracteres ou mais e limite de tentativas por IP.
- [x] Confirmação de e-mail e troca de senha pela fila `emails`.
- [x] Perfis em `vinculos`: responsável, aluno, professor, secretaria, financeiro, portaria, coordenação, direção. Um login para todas as escolas (ADR 0011).
- [x] Permissões por módulo e ação (ver, criar, editar, excluir, aprovar) em `permissoes`, com a matriz padrão de `Escola-Permissoes`. `exigirPermissao` protege `/alunos` e os dados completos da escola.
- [x] Uma pessoa com vários perfis troca de perfil sem novo login (`App-Perfil-Escolha` e `ProfileSwitcher`).
- [x] Telas: `Main` (entrar), `Celular-Entrar`, recuperar a senha e senha nova.
- [ ] Convite da escola para o primeiro acesso. Hoje o cadastro aberto só existe fora de produção.
- [ ] Responsável ligado aos próprios filhos, e alcance por turma para o professor.
- [ ] Tela `Escola-Permissoes` gravando a matriz da escola.
- [ ] Passkeys e login social.

### API

Padrões da [ADR 0008](adr/0008-padroes-de-api.md), descritos em [api/padroes.md](api/padroes.md):

- [x] OpenAPI 3.1 gerado dos schemas Zod, em `/api/v1/openapi.json`, publicado em `/api/docs` e versionado em `docs/api/openapi.json`.
- [x] Versionamento por prefixo `/api/v1`.
- [x] Erros RFC 9457 (`application/problem+json`) com `code` estável.
- [x] `X-Request-Id` em toda resposta, repassado quando o cliente envia.
- [x] Limite de taxa por IP, com `429` e `Retry-After`.
- [x] Helpers de paginação por cursor em `packages/contracts` (`cursorQuerySchema`, `paginated`).
- [ ] Listas existentes no formato `{ data, nextCursor }` e filtros validados, junto com os repositórios Drizzle.
- [x] Contador do limite de taxa no Redis (`rate-limit-redis`), com `trust proxy` configurável (`TRUST_PROXY`).
- [x] `413` `CORPO_GRANDE_DEMAIS` em problem+json para corpo acima de 1 MB.
- [ ] Limite de taxa por usuário, agora que o login existe.
- [ ] Idempotência por cabeçalho `Idempotency-Key` em toda operação que cria cobrança ou envia mensagem.

Outros itens da API:

- [x] Filas com BullMQ e Redis (ADR 0009): worker separado, id determinístico, tentativas com espera exponencial e retenção de falhas. Primeira fila: `emails` ([operacao/filas.md](operacao/filas.md)).
- [x] Arquivos em armazenamento compatível com S3 (ADR 0010): chave por escola, URL assinada de upload e download, bucket criado em desenvolvimento ([operacao/armazenamento.md](operacao/armazenamento.md)). A rota pública entra com a funcionalidade de documentos.
- [ ] Filas de push, PDF e webhooks, e a tabela de saída (outbox) para enfileirar na mesma transação.

### Observabilidade

Detalhes em [operacao/observabilidade.md](operacao/observabilidade.md).

- [x] Logs estruturados com pino, com `requestId`, `escolaId` e `trace_id` em cada linha. Health e ready fora do log.
- [x] Rastreamento com OpenTelemetry na API e no worker (HTTP, Express, pg, ioredis), exportado por OTLP. Jaeger local no perfil `observabilidade`.
- [ ] Rastreamento no portal.
- [x] Captura de erros 5xx da API e de tarefas que falharam de vez com Sentry, ligada por `SENTRY_DSN`.
- [ ] Sentry no portal.
- [x] `/api/health` (processo vivo) e `/api/ready` (Postgres e Redis respondendo, com a dependência que falhou no corpo).

### DevOps

Operação documentada em [operacao/](operacao/README.md).

- [x] Docker Compose local com Postgres, Redis, Mailpit (e-mail) e RustFS (arquivos compatíveis com S3).
- [x] Dockerfile multi-stage da API, imagem sem root e com healthcheck. O worker usa a mesma imagem com outro comando.
- [x] Imagem do portal em nginx sem root, com CSP, cache por tipo de arquivo e `/api` repassado para a API.
- [x] CI constrói as 2 imagens a cada pull request. CodeQL e `npm audit` rodam no CI.
- [ ] 3 ambientes: desenvolvimento, staging e produção. Hospedagem por ADR. O plano está em `operacao/README.md`; falta o ADR 0011.
- [ ] Deploy automático em staging a cada merge na `main`. Produção por tag de versão.
- [ ] Ambiente de preview por pull request para o portal.
- [ ] Migrações rodando no pipeline antes do deploy, sempre compatíveis com a versão anterior.
- [ ] Segredos no gerenciador da hospedagem, nunca no repositório.

### Testes

- [x] Testes de integração da API contra Postgres real com Testcontainers.
- MSW para simular a API nos testes do portal.
- Playwright para testes de ponta a ponta dos fluxos principais. A base roda no CI (`apps/web/e2e`, job `e2e`), com o login simulado em `entrar.spec.ts`. Falta rodar contra a API real.

Critério de pronto: alguém entra no portal em staging com um usuário de teste, vê só os dados da própria escola, e um erro forçado aparece no Sentry com o rastreamento completo.

## Fase 2. Casca do portal por perfil e PWA (em andamento)

As cascas exigem sessão e vínculo desde a entrega do login. Detalhes em [frontend.md](frontend.md).

- [x] Layout por perfil: família, aluno, professor e escola, cada um com o próprio menu lateral (`SideNav`) e barra inferior no celular (`TabBar`, telas `Celular-Hoje` e `Celular-Mais`). Itens sem tela abrem "Em construção".
- [x] Tema da escola aplicado pelo `SchoolTheme` a partir da cor cadastrada (`corMarca` de `/api/v1/escolas/{slug}/publica`).
- [ ] Logo da escola no menu e no manifesto, vinda do cadastro.
- [x] Preferências de acessibilidade: tamanho de texto, fonte legível, movimento reduzido, alto contraste (`Familia-Preferencias`). Hoje salvas no navegador; passam para a conta com o login.
- [x] PWA instalável com Workbox: manifesto, ícones, tela de abertura, casca do portal salva para abrir sem conexão, aviso de versão nova e tela `/sem-internet` (`Celular-Offline`).
- [ ] Dados das telas visitadas disponíveis sem conexão (hoje `/api/` é só rede) e convite de instalação próprio (`Celular-Instalar`).
- [x] Estados de tela padronizados: vazio, erro e carregando com `QueryState` (`Familia-Estados`, `Escola-Estados`).
- [x] Storybook do design system com o addon de acessibilidade (axe).
- [x] Teste de acessibilidade em cada pull request: axe nas telas do e2e (Playwright) e em cada história do Storybook, Lighthouse em `/` e `/escola` com acessibilidade e boas práticas a partir de 0,9 (jobs `e2e`, `storybook` e `lighthouse`).
- [x] Páginas sob demanda: arquivo principal do portal de 629 kB para 34 kB, sem o aviso de tamanho do Vite.
- [ ] Comparação visual por screenshot em cada pull request. Ainda não existe: falta decidir onde guardar as imagens de referência e em qual sistema operacional gerá-las, porque a fonte renderiza diferente no Windows e no Linux.

Critério de pronto: os 4 perfis navegam no celular e no desktop com a marca da escola, e o Lighthouse dá 90 ou mais em acessibilidade. O Lighthouse 12 tirou a categoria PWA; manifesto, service worker e abertura sem conexão são conferidos por `e2e/pwa.spec.ts`. Notas atuais: acessibilidade 0,98 e boas práticas 1,00 em `/` e `/escola`.

## Fase 3. Cadastro escolar

Base de tudo que vem depois: sem aluno, turma e responsável cadastrados, nenhuma outra tela tem dados.

| Domínio           | Telas                                                                                             |
| ----------------- | ------------------------------------------------------------------------------------------------- |
| Escola e unidades | `Escola-Modulos`, `Escola-Permissoes`, `Escola-Painel`                                            |
| Alunos            | `Escola-Alunos`, `Escola-Ficha-do-aluno`, `Escola-Transferencias`                                 |
| Turmas e horários | `Escola-Horarios`, `Professor-Horarios`                                                           |
| Equipe            | `Escola-Equipe`, `Escola-Equipe-Novo`, `Escola-Ficha-do-funcionario`, `Escola-Ficha-do-professor` |
| Importação        | `Escola-Importacao` (planilha CSV com validação linha a linha)                                    |
| Solicitações      | `Escola-Solicitacoes`                                                                             |

- Módulos de API: `escolas`, `unidades`, `alunos`, `responsaveis`, `turmas`, `equipe`, `importacao`.
- Auditoria: toda alteração em ficha de aluno grava quem, quando e o valor anterior.
- CPF mascarado na tela e criptografado no banco.

## Fase 4. Pedagógico

| Público   | Telas                                                                                                                                                                                                                                   |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Professor | `Professor-Inicio`, `Professor-Diario`, `Professor-Tarefas`, `Professor-Materiais`, `Celular-Professor`, `Celular-Chamada`, `Celular-Lancar`                                                                                            |
| Escola    | `Escola-Chamada`, `Escola-Frequencia`, `Escola-Notas-e-faltas`, `Escola-Boletins`, `Escola-Pontos-extras`, `Escola-Medidas`, `Escola-Certificados`, `Escola-Relatorios`                                                                 |
| Família   | `Familia-Hoje`, `Familia-Boletim`, `Familia-Boletim-PDF`, `Familia-Frequencia`, `Familia-Horarios`, `Familia-Materiais`, `Celular-Boletim`, `Celular-Frequencia`, `Celular-Horarios`                                                    |
| Aluno     | `Aluno-Hoje`, `Aluno-Notas`, `Aluno-Tarefas`, `Aluno-Entregar`, `Aluno-Horario`, `Aluno-Materiais`, `Celular-Aluno`, `Celular-Notas`, `Celular-Aluno-Notas`, `Celular-Aluno-Tarefas`, `Celular-Aluno-Entregar`, `Celular-Aluno-Horario` |

- Chamada offline: o professor lança a frequência sem internet, a fila fica no IndexedDB e sincroniza quando a conexão volta, com resolução de conflito por horário de lançamento.
- Boletim em PDF gerado na fila, com código de autenticidade verificável.
- Regras de média e recuperação configuráveis por escola, testadas por tabela de casos.

## Fase 5. Comunicação

| Domínio      | Telas                                                                                                                |
| ------------ | -------------------------------------------------------------------------------------------------------------------- |
| Comunicados  | `Escola-Comunicados`, `Escola-Avisos`, `Familia-Comunicados`, `Celular-Comunicados`                                  |
| Chat         | `Escola-Chat`, `Familia-Chat`, `Celular-Chat`                                                                        |
| Notificações | `Escola-Notificacoes`, `Familia-Notificacoes`, `Celular-Notificacoes`                                                |
| Agenda       | `Escola-Agenda`, `Escola-Calendario`, `Familia-Agenda`, `Familia-Calendario`, `Celular-Agenda`, `Celular-Calendario` |
| Autorizações | `Escola-Autorizacoes`, `Familia-Autorizacoes`, `Celular-Autorizacoes`                                                |
| Ocorrências  | `Escola-Ocorrencias`, `Familia-Ocorrencias`, `Celular-Ocorrencias`                                                   |
| Atendimentos | `Escola-Atendimentos`, `Familia-Atendimentos`                                                                        |
| Pesquisas    | `Escola-Pesquisas`, `Familia-Pesquisas`                                                                              |

- Chat em tempo real por WebSocket, com mensagens persistidas e recibo de leitura.
- Web Push no PWA, com preferência por tipo de aviso.
- Comunicado com confirmação de leitura e lembrete automático para quem não leu.
- Modo leitura simples: resumo obrigatório em até 2 frases.

## Fase 6. Financeiro e matrícula

| Domínio      | Telas                                                                                    |
| ------------ | ---------------------------------------------------------------------------------------- |
| Mensalidades | `Escola-Mensalidades`, `Familia-Financeiro`, `Familia-Mensalidade`, `Celular-Financeiro` |
| Pagamento    | `Celular-Pix`, `Escola-Caixa`                                                            |
| Fiscal       | `Escola-Fiscal`, `Familia-Recibo-IR`, `Escola-DAE`, `Familia-DAE`                        |
| Matrícula    | `Escola-Matriculas`, `Familia-Matricula`, `Familia-Rematricula`, `Escola-Captacao`       |
| Contratos    | `Escola-Contratos`, `Familia-Contrato`, `Familia-Documentos`, `Celular-Documentos`       |
| Loja         | `Escola-Loja`, `Familia-Loja`                                                            |

- Gateway de pagamento para boleto e Pix por ADR (opções a comparar: Asaas, Efí, Iugu, Pagar.me).
- Webhooks do gateway idempotentes, assinados e reprocessáveis.
- Valores em centavos (inteiro) no banco. Nenhum cálculo de dinheiro em ponto flutuante.
- Multa, juros e desconto de pontualidade calculados no service, com testes para cada regra do `dados-canonicos.md`.
- Assinatura eletrônica de contrato com registro de IP, data e hash do documento.
- Emissão de NFS-e pela prefeitura da escola, via integrador (ADR).

## Fase 7. Operação escolar

| Domínio    | Telas                                                                                                                                                                   |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Portaria   | `Escola-Portaria`, `Escola-Portaria-Gestao`, `Celular-Portaria`                                                                                                         |
| Integral   | `Escola-Integral`, `Escola-Integral-Grade`, `Escola-Integral-Coordenacao`, `Familia-Integral`, `Celular-Integral`                                                       |
| Biblioteca | `Escola-Biblioteca`, `Escola-Biblioteca-Acervo`, `Escola-Biblioteca-Gestao`, `Familia-Biblioteca`, `Aluno-Biblioteca`, `Celular-Biblioteca`, `Celular-Aluno-Biblioteca` |
| Saúde      | `Escola-Saude`, `Familia-Saude`, `Celular-Saude`                                                                                                                        |
| Cardápio   | `Escola-Cardapio`, `Familia-Cardapio`, `Celular-Cardapio`                                                                                                               |
| Inclusão   | `Escola-Inclusao`, `Familia-Inclusao`, `Celular-Inclusao`                                                                                                               |
| Fotos      | `Escola-Fotos`, `Escola-Galeria`, `Familia-Galeria`                                                                                                                     |
| Outros     | `Escola-EJA`, `Aluno-Carteirinha`, `Celular-Aluno-Carteirinha`                                                                                                          |

- Dados de saúde e inclusão com acesso restrito por perfil e registro de cada leitura.
- Alergia grave aparece em destaque para portaria, cantina e professor da turma.
- Fotos de alunos só para responsáveis autorizados, com consentimento registrado.

## Fase 8. App nativo

- Expo (React Native) em `apps/mobile`, reaproveitando `packages/contracts` e as regras de negócio.
- Componentes nativos próprios, com os tokens de `packages/design-system` exportados para React Native.
- Recursos que justificam o app: push, câmera (foto de documento e entrega de tarefa), leitura de QR na portaria, biometria e passkeys.
- Build e publicação nas lojas com EAS; atualização de JavaScript sem nova versão de loja via EAS Update.
- 38 telas `App-*` do protótipo, divididas entre família, aluno, professor, portaria e gestão.

## Fase 9. Escala, segurança e operação contínua

Esta fase começa junto com a fase 1 e não termina.

- Segurança: CodeQL no CI, `npm audit` bloqueando vulnerabilidade alta, checklist OWASP ASVS nível 2, teste de invasão antes do primeiro cliente.
- LGPD: inventário de dados pessoais, base legal por finalidade, termo de consentimento, exportação e exclusão de dados a pedido, retenção definida por tipo de dado.
- Backup do Postgres com recuperação para qualquer ponto no tempo e teste de restauração mensal.
- Infraestrutura como código com OpenTofu.
- Feature flags por escola para liberar módulos aos poucos.
- SLOs: 99,5% de disponibilidade no portal e p95 abaixo de 300 ms na API.
- Métricas DORA (frequência de deploy, tempo de entrega, taxa de falha, tempo de recuperação) acompanhadas no fim de cada mês.

## Como trabalhar em cada fase

- Trunk-based: branches curtas a partir da `main`, pull request pequeno, merge em até 2 dias.
- Cada tela portada é um pull request com contrato, módulo de API, feature no portal e testes.
- Definição de pronto: CI verde, revisão de código, tela conferida contra `prototipo/visualizar`, deploy em staging.
- Versões com tags semânticas e changelog gerado dos commits.

## Decisões

| ADR                                                   | Decisão                                   | Situação                                                                |
| ----------------------------------------------------- | ----------------------------------------- | ----------------------------------------------------------------------- |
| [0005](adr/0005-postgresql-e-drizzle.md)              | Banco e ORM                               | Aceita: PostgreSQL 17 com Drizzle                                       |
| [0006](adr/0006-multi-escola-por-dominio-e-rls.md)    | Multi-escola                              | Aceita: `escola_id` com Row Level Security. Resolução pela rota na 0011 |
| [0007](adr/0007-autenticacao-better-auth.md)          | Autenticação                              | Aceita: Better Auth com sessão em cookie                                |
| [0008](adr/0008-padroes-de-api.md)                    | Padrões da API                            | Aceita: `/api/v1`, RFC 9457, OpenAPI gerado do Zod                      |
| [0009](adr/0009-filas-com-bullmq.md)                  | Filas                                     | Aceita: BullMQ com Redis                                                |
| [0010](adr/0010-armazenamento-de-arquivos-s3.md)      | Arquivos                                  | Aceita: API S3, RustFS no ambiente local                                |
| [0011](adr/0011-escola-pela-rota.md)                  | Endereço das escolas                      | Aceita: `recreio-edu.com.br/{slug}`, domínio único                      |
| [0012](adr/0012-app-nativo-white-label.md)            | App nativo white label                    | Aceita: app Recreio com marca dinâmica, app próprio como plano pago     |
| [0013](adr/0013-assinaturas-e-cobranca-recorrente.md) | Assinaturas e cobrança recorrente         | Proposta: plataforma separada, subconta por escola, Asaas a confirmar   |
| 0014                                                  | Hospedagem e ambientes                    | Pendente: comparar custo                                                |
| 0015                                                  | Assinatura eletrônica e NFS-e das escolas | Pendente                                                                |
| 0016                                                  | Tempo real (chat e notificações)          | Pendente: proposta WebSocket na própria API                             |
