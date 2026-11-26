Recreio Sistema Educacional é a base visual de um ecossistema white label de gestão escolar: ERP da escola, financeiro, comunicação e app da família, na web responsiva (PWA) primeiro e no app nativo depois. Slogan: "Toda a escola. Em um só lugar." Cada escola entra com a sua logo, a sua cor e o seu vocabulário; o que não é identidade da escola (cores de estado, tipografia, espaçamento, acessibilidade, movimento) é fixo e vem daqui.

Quem usa: responsáveis no celular, quase sempre com pressa e uma mão livre; professores em sala, às vezes sem internet; secretaria, portaria e financeiro no desktop, o dia inteiro, com tabelas longas; direção olhando números. O mesmo componente serve aos quatro, e a densidade muda pelo contexto.

Esta é a versão de demonstração comercial: todos os exemplos usam o Colégio Recreio, uma escola fictícia de Fortaleza descrita no fim deste guia. Telas novas usam os mesmos nomes, turmas e valores.

## Como começar

```jsx
const { RecreioProvider, AppShell, SideNav, TopBar, StatCard } = window.Recreio;

<RecreioProvider seed="#0067CC" theme="claro">
  <AppShell sidenav={<SideNav school={{ name: 'Colégio Recreio', unit: 'Unidade Aldeota' }} groups={grupos} />} topbar={<TopBar title="Bom dia, Lúcia" />}>
    <StatCard variant="hero" label="Recebido em novembro" value={1924380} icon="wallet" />
  </AppShell>
</RecreioProvider>
```

`RecreioProvider` aplica a cor da escola (`seed`), o tema, as preferências de acessibilidade da pessoa e monta os toasts. Tudo dentro dele usa só tokens: nenhuma tela escreve cor, tamanho ou duração à mão.

## Conteúdo

### Voz

Escrevemos como a secretaria boa de uma escola fala com a família: frase curta, verbo na frente, nada de festa. O sistema informa e pede; não comemora, não se desculpa em excesso, não faz piada com dinheiro nem com nota.

| em vez de | escrever |
| --- | --- |
| Ops! Algo deu errado 😕 | Não conseguimos enviar a frequência. Ela ficou salva neste aparelho e sobe quando a internet voltar. |
| Clique aqui para visualizar seu boleto | Ver boleto |
| Parabéns! Pagamento realizado com sucesso! | Pagamento recebido. O comprovante está em Financeiro. |
| Você não possui notificações no momento | Nada novo por aqui. |
| Deseja realmente excluir? | Excluir a avaliação "Prova 2"? As notas lançadas nela também saem. |

Regras:

- Botão diz o que acontece: "Pagar com Pix", "Salvar notas", "Confirmar saída". Nunca "OK", "Enviar" solto ou "Clique aqui".
- Erro diz o que aconteceu e o que fazer agora, nessa ordem. Código técnico só em "Detalhes" (`ErrorState`).
- Prazo e valor sempre explícitos: "vence quinta, 10/12", "R$ 1.406,00". Nunca "em breve" para dinheiro.
- Tratamento por "você". Nome do filho no texto quando a família tem mais de um: "Mensalidade de dezembro · Davi".
- Sem emoji na interface. Sem ponto de exclamação, salvo citação de quem escreveu.
- Nada de texto com cara de gerado: sem "Explore", "Descubra", "Potencialize", sem trio de adjetivos, sem frase de efeito em estado vazio.

### Modo leitura simples

Com `data-leitura="simples"` o comunicado mostra o resumo em destaque antes do texto completo. Quem escreve comunicado preenche o resumo em até duas frases, sem sigla.

### Números, datas e dinheiro

- Moeda: `R$ 1.406,00`, sempre com centavos, à direita em tabela, algarismos tabulares. Use `Recreio.brl()`.
- Nota: uma casa decimal, vírgula (`8,5`). Média abaixo de 6 em pílula vermelha, 6 ou mais em pílula verde.
- Data curta: `25/11` ou `quarta, 25/11`; com ano só fora do ano corrente. Hora em 24h: `14h30`.
- Código Pix, linha digitável, matrícula e código de autenticidade em `code` (fonte mono), sempre com `CopyButton` ao lado.
- CPF sempre mascarado na tela (`***.482.193-**`).

### Vocabulário da escola

O vocabulário é configuração da escola. Cada termo tem uma chave e o padrão abaixo; a escola troca na implantação.

| chave | padrão | alternativas comuns |
| --- | --- | --- |
| aluno | aluno | estudante, criança (infantil), acadêmico (faculdade) |
| turma | turma | classe, sala, grupo |
| responsavel | responsável | família, pais |
| mensalidade | mensalidade | parcela, anuidade |
| boletim | boletim | relatório de desempenho, parecer (infantil) |
| unidade | unidade | campus, sede |
| integral | tempo integral | contraturno, período estendido |

## Fundamentos visuais

### Cor

A paleta sai da logo: marinho `#001949` (confiança), azul `#0067CC` (tecnologia), verde (integração) e amarelo `#FECF04` (dinamismo). A tela nunca é cinza neutro: o chão é azul muito claro, a navegação é marinho e cada módulo tem cor própria.

- Superfícies: `surface-0` é o chão da página (`#EEF3FA`); `surface-1` é o cartão branco; `surface-2` e `surface-3` são cabeçalho de tabela, trilho e preenchimento. Cartões têm `line` de 1px e `shadow-1` tingida de marinho.
- Tinta: `ink` é marinho quase preto; `ink-2` texto de apoio; `ink-3` só placeholder. Todas passam 4,5:1 sobre todas as superfícies, linhas zebradas e fundos `-soft`.
- Navegação: `nav` (marinho) com texto `on-nav`, item ativo em `nav-2` e marcador amarelo `accent`. Com `SchoolTheme`, `nav` vira a versão profunda da cor da escola.
- Escola: `brand`, `brand-strong`, `brand-soft`, `on-brand`, `brand-ink` são o slot white label, padrão azul Recreio. Botão primário em degradê de `brand` para `brand-strong` com `shadow-brand`. Texto na cor da escola usa sempre `brand-ink`.
- Destaque: `accent` (amarelo Recreio) marca o que precisa de ação agora: pendência, não lido, item ativo, "Agora" na linha do tempo. Nunca é cor de texto; texto sobre ele usa `on-accent`.
- Estados: `success` verde (pago, presente, aprovado), `warning` laranja escuro, `danger` vermelho, `info` roxo (para não competir com o azul da escola). Verde e vermelho não se distinguem só pela cor para quem tem daltonismo, então estado sempre vem com ícone e palavra.
- Categorias: oito cores (`cat-azul`, `cat-verde`, `cat-amarelo`, `cat-laranja`, `cat-vermelho`, `cat-roxo`, `cat-ciano`, `cat-rosa`), cada uma com `-soft` (fundo) e `-ink` (ícone e texto, 4,5:1). Identificam módulo, tipo de evento, tipo de ocorrência, modalidade e avatar.

| categoria | módulos e usos |
| --- | --- |
| azul | comunicados, agenda, turno regular, tarefas |
| verde | financeiro, matrícula, recibos, tempo integral, elogios |
| amarelo | eventos, agenda online, semi-integral |
| laranja | ocorrências, portaria, atrasos |
| vermelho | saúde, faltas, saída antecipada, permissões |
| roxo | notas, boletim, provas, reforço |
| ciano | chat, biblioteca, atendimentos |
| rosa | educação infantil, diário, saúde no histórico |

### Temas

`claro` (padrão), `escuro` (marinho profundo, nunca preto puro), `alto-contraste` e `alto-contraste-escuro`. Os de alto contraste levam texto a 7:1, linhas mais escuras e removem as sombras. O tema segue o sistema operacional até a pessoa escolher outro em Preferências.

### Tipografia

- `sans`: a fonte do sistema da Apple. No iPhone, iPad e Mac a interface sai em SF Pro, a fonte padrão do iOS; no Windows e no Android sai em Inter, a mais próxima do SF, carregada do Google Fonts. A Apple não licencia o SF para outras plataformas, por isso a pilha é `-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui`.
- `display`: a mesma família em corte de títulos (SF Pro Display), peso 700 a 800, espaçamento apertado. Saudação, título de página de destaque e vitrine da entrada.
- `mono`: `ui-monospace` (SF Mono no Apple) para Pix, linha digitável, matrícula e protocolo.
- `legivel`: Atkinson Hyperlegible Next, só quando a pessoa liga "Fonte mais legível" (`data-font="legivel"`).
- Corpo em `body`, 16px/24px. No celular nada abaixo de `caption`, 13px. Tudo em `rem` para acompanhar o tamanho de texto escolhido (até 200%).

### Espaço, forma e profundidade

- Grade de 4px: `space-1` a `space-16`. Cartão com `space-4` no celular e `space-5` no desktop; entre cartões, `space-6`.
- Cantos arredondados no padrão iOS: `radius-md` (10px) em botão e campo, `radius-lg` (14px) em cartão, `radius-xl` (20px) em diálogo e gaveta, `radius-full` em avatar, pílula e switch.
- Sombras tingidas de marinho: `shadow-1` em cartão, `shadow-2` em menu e toast, `shadow-3` em diálogo, `shadow-brand` no botão primário e no indicador principal.
- Alvos: `touch-min` (44px) é o mínimo de qualquer coisa tocável. No celular, botão e campo sobem para `control-lg`.

### Tabelas e listas

- Linha de dados com 44px (36px no modo compacto, 40px na digitação de notas). Cabeçalho em caixa alta pequena sobre `surface-2`.
- Zebra em toda lista densa: linha 1 em `surface-1`, linha 2 em `row-alt`, linha 3 em `surface-1`, e assim por diante. Hover e foco em `row-hover`; na tabela, um filete na cor da escola marca a linha sob o ponteiro.
- Vale para tabela, digitação de notas, chamada, chat, portaria, biblioteca, agenda, documentos e permissões.

### Layout responsivo

- Até 860px: a navegação lateral some e entra a `TabBar` fixa embaixo, com no máximo cinco destinos.
- Até 640px: tabelas viram lista de cartões, diálogos viram gaveta (`Sheet`) presa embaixo, ações primárias ocupam a largura toda.
- Desktop largo: `AppShell` aceita uma coluna de apoio de 320px.
- Toda tela de trabalho usa o shell `rc-shell`: menu lateral com a altura da janela e preso no topo ao rolar, cabeçalho e conteúdo ocupando toda a largura ao lado do menu, com margem de 32px no desktop e 16px abaixo de 860px (`rc-shell-bar` no cabeçalho). Em markup puro, use as classes `rc-shell`, `rc-shell-side`, `rc-shell-main`, `rc-shell-content` e `rc-shell-tabbar`.
- Conteúdo principal mais painel ao lado: classe `rc-split` (3fr e 2fr por padrão; outra proporção via `--split`). Empilha sozinha quando a coluna de conteúdo fica abaixo de 760px.
- Grupos que abrem e fecham (mensalidades por situação e ano): `<details class="rc-fold">` com `<summary class="rc-fold-sum">`. Funciona sem script. Linha clicável: `<a class="rc-rows-row">` leva à tela de detalhe, que sempre tem o botão de voltar no topo.
- Cabeçalho de página: `rc-pagehead` com `rc-pagehead-icon` (quadrado de 44 px, fundo azul claro, mesmo ícone do item do menu) e `rc-pagehead-text` (título e subtítulo). O ícone fica centralizado entre os dois textos.
- Telas de celular (PWA): moldura `rc-app` de 390×844 com `rc-app-status`, cabeçalho `rc-app-head` (início) ou `rc-app-bar` (telas internas, com voltar), área `rc-app-scroll` e `rc-app-body`, cartões `rc-app-card`, linhas `rc-app-row`, atalhos `rc-app-grid` com `rc-app-tile`, barra de ação `rc-app-cta` e `TabBar`. Avisos no celular sobem de baixo: `rc-overlay rc-popup is-sheet`. Notas no celular usam `GradeList`.
- Fichas (aluno, profissional): abas verticais `<nav class="rc-vtabs">` com `<a class="rc-vtab is-active">`, ícone, rótulo e contador (`rc-vtab-count`, `is-alert` em vermelho). Abaixo de 760px viram faixa horizontal. Cadastro em leitura: `<dl class="rc-fields">` com `rc-field` (rótulo em cima, valor embaixo); `rc-field-wide` ocupa a linha toda.
- Avisos e confirmações no centro da tela, com fundo escurecido: `Dialog` e `ConfirmDialog` em telas com script. Em telas estáticas, `<div id class="rc-overlay rc-popup">` abre por `<a href="#id">` e fecha por `<a href="#">`; o bloco fica fora do conteúdo principal, para escurecer também o menu. Tipos: confirmação (brand), ação destrutiva (danger, com botão vermelho e, se grave, digitar para confirmar), alterações não salvas e sessão expirando (warning), erro (danger, com código e Tentar de novo), processando (spinner e barra, sem X), confirmação com motivo (info, motivo obrigatório) e sucesso (`rc-dialog-hero`, ícone grande centralizado). O botão principal diz o que vai acontecer.
- Regra de salvar: toda região em que a pessoa troca um dado tem botão Salvar. Ele nasce desabilitado, habilita na primeira mudança e mostra a hora depois de gravar. Sair da tela com alteração pendente abre o aviso "Sair sem salvar?" com Continuar editando, Sair sem salvar e Salvar e sair. Use `SaveGuard` em volta dos campos. `GradeEntry`, `GradeList`, `AttendanceRoster`, `BrandEditor`, `PermissionMatrix`, `PreferencesPanel`, `IntegralBoard` e `RoutineEditor` já trazem a barra e o aviso pelo hook `useUnsaved`. No `AssignmentSubmit` a mesma barra vira Enviar trabalho: nasce desabilitada, diz o que falta e pede confirmação antes de enviar. Busca e filtro não contam como alteração (`data-nosave`). Ações que terminam em confirmação própria (publicar, enviar, registrar) ficam fora da regra.
- Tela que ocupa a altura da janela (chat, caixa de entrada): `rc-grow` no bloco principal, com `--grow-top` (altura do que vem antes, em px) e `--grow-min` (altura mínima). O bloco fica com `max(--grow-min, 100vh - --grow-top)`. Dentro dele, `rc-fillh` estica a coluna e rola por dentro. Abaixo de 760px de conteúdo a altura volta a ser automática.
- Abas de página que levam a outra tela: `<nav class="rc-tabs rc-tabs-links">` com `<a class="rc-tab is-on">` na tela atual.
- Lista que abre o detalhe embaixo da linha (integral): nada vem aberto, o detalhe aparece só para o item escolhido. Use quando o detalhe é para lançar, e a lista precisa continuar à vista.
- Indicadores clicáveis: `StatCard` com `href="#id"` abre o pop-up com a lista detalhada (linhas `rc-popup-row`).
- Listas com colunas (ocorrências, registros): classes `rc-rows-row` e `rc-rows-head` com as colunas em `--cols`. Abaixo de 680px de conteúdo cada linha vira um cartão empilhado e o cabeçalho some. Cada célula, menos a primeira, leva `data-label` com o nome da coluna: no cartão empilhado o nome aparece acima do valor.
- Grades de cartões: `repeat(auto-fit, minmax(min(100%, Npx), 1fr))`, para nunca estourar a largura do celular.
- Tela de entrada (`LoginLayout`): formulário centralizado numa coluna de 400px, com a vitrine do produto ao lado a partir de 861px.

### Movimento e carregamento

O sistema é animado, mas o movimento sempre explica de onde algo veio e para onde foi.

- Durações: `dur-instant` para pressionar, `dur-fast` para controles, `dur-base` para menu, toast e acordeão, `dur-slow` para diálogo, gaveta e troca de tela. Curvas: `ease-standard`, `ease-exit` e `ease-spring` (só em confirmação pequena: check do pagamento, saída confirmada, tarefa feita).
- Carregamento: a tela aparece na hora com esqueleto do formato real (`Skeleton`, `LoadingCard`); spinner só dentro do botão que está trabalhando. Barra de progresso quando dá para medir.
- Números contam do zero até o valor na primeira carga (indicadores, alcance do comunicado, total do informe de IR). Listas entram em cascata de 30ms por item, no máximo oito. O registro mais novo da portaria pisca em amarelo. A vitrine da entrada tem formas que flutuam e cinco destaques que trocam sozinhos.
- Troca de tela: uma barra fina corre no topo ao abrir cada tela (`rc-shell::before`, 900ms) e os blocos do conteúdo entram em cascata de 60ms (`rc-shell-content > *` e `rc-app-body > *`). A animação termina sem deixar `transform`, para não prender menus e selects.
- Retorno de toque em todo controle: botão e botão de ícone encolhem, item de menu, chip, aba, aba vertical, opção de segmento e item da barra inferior também. Linha de lista escurece ao pressionar. Chave estica o botão. O realce cinza do navegador no toque fica desligado.
- Salvar sempre devolve um toast de sucesso (`useToast`), além da hora na barra de salvar. Ação com confirmação própria termina em pop-up de sucesso.
- Lista mais larga que o cartão: a `role="table"` com `rc-rows-row` rola de lado e, abaixo de 520px do próprio cartão, vira cartões empilhados. Lista com muitas colunas ocupa a largura total da tela, fora do `rc-split`.
- Linha com avatar, texto, pílula e ação: `rc-popup-row` aceita o quarto filho e cria a quarta coluna.
- `prefers-reduced-motion` e a preferência "Reduzir movimento" zeram transições e animações. Nenhuma informação depende de animação.

## White label

O que a escola define na implantação: nome, logo (SVG ou PNG quadrado), cor principal, unidades, módulos contratados e vocabulário. O que ela não muda: tipografia, cores de estado, `accent`, categorias, superfícies, espaçamento, raios, movimento e as regras de acessibilidade.

- A cor principal passa por `schoolPalette(seed)`: converte para OKLCH, gera `brand-*` e `nav` para cada tema e ajusta a luminosidade até cada par passar 4,5:1 (7:1 no alto contraste). A escola vê os ajustes em `BrandPreview` antes de publicar.
- Marca completa da escola: a direção edita em `BrandEditor` (nome, logos, cores primária, secundária e destaque, fonte, cantos e dados dos documentos). `saveBrand` guarda a marca e avisa as telas abertas; o `RecreioProvider` aplica em tudo com `brandVars`. Documentos gerados leem `loadBrand()` para o cabeçalho, o CNPJ e a assinatura.
- A logo da escola aparece em `SideNav`, na entrada e nos documentos por `SchoolMark`, que cai para as iniciais quando não há arquivo.
- O Recreio Sistema Educacional aparece dentro da escola só como texto: "Feito por Recreio Sistema Educacional" (`MadeBy`). A logo do Recreio aparece na vitrine da entrada e nas telas da plataforma.
- Módulo desligado não aparece em lugar nenhum: nem na navegação, nem na busca, nem em estado vazio sugerindo contratar.

## Acessibilidade

O padrão já atende WCAG 2.2 AA: contraste verificado em todos os temas, foco visível (`focus`, 2px, afastado 2px), alvos de 44px, ordem de leitura igual à ordem visual, rótulo em todo campo e botão de ícone, status anunciado por leitor de tela, tabela com cabeçalho real, nada que pisque mais de três vezes por segundo.

Cada pessoa ainda escolhe em `PreferencesPanel` (salvo no perfil, vale em todos os aparelhos):

| preferência | atributo | efeito |
| --- | --- | --- |
| Tamanho do texto | `font-size` da raiz, 100% a 200% | tudo em `rem` escala junto, layout reflui |
| Fonte mais legível | `data-font="legivel"` | troca para Atkinson Hyperlegible Next |
| Espaçamento amplo | `data-spacing="amplo"` | entrelinha 1,6, letras e palavras afastadas (WCAG 1.4.12) |
| Reduzir movimento | `data-motion="reduzido"` | sem animação nem transição |
| Modo foco | `data-foco="on"` | esconde o que é secundário (`data-secondary`) |
| Leitura simples | `data-leitura="simples"` | resumo antes do texto, rótulos curtos |
| Tema | `data-theme` | claro, escuro e os dois de alto contraste |

Comunicados podem vir com vídeo em Libras (`AnnouncementCard libras`), e todo áudio ou vídeo da escola pede legenda no envio.

## Iconografia

Conjunto próprio de 99 ícones em traço, grade de 24px, traço 1,75, pontas arredondadas, cor herdada do texto. Nomes em `Recreio.iconNames`; uso por `<Icon name="gate" />`.

- Ícone acompanha palavra. Ícone sozinho só em ação universal (fechar, buscar, menu, mais opções) e sempre com `label`.
- Ícone de módulo vai dentro de um quadro arredondado em `cat-*-soft` com traço em `cat-*-ink`; ligado, o quadro fica cheio na cor do módulo.
- Sem emoji, sem ícone colorido de outra biblioteca, sem ilustração de pessoas. Estado vazio usa três peças nas cores Recreio.
- Ícone novo segue a mesma grade e traço e entra no conjunto `I` de `core.jsx`.

## Componentes

91 componentes em 15 grupos. Os genéricos não sabem nada de escola; os de módulo compõem os genéricos e carregam regra de negócio visual (prazo, prioridade, confirmação, permissão).

- Fundamentos: Icon, Logo, SchoolMark, MadeBy, RecreioProvider, SchoolTheme
- Ações: Button, IconButton, CopyButton, SegmentedControl, Kbd
- Campos: TextField, TextArea, SearchField, Select, Checkbox, RadioGroup, Switch, CodeInput, Slider, FilterChips, FileDrop
- Feedback: Badge, StatusPill, Alert, ToastProvider
- Carregamento: Spinner, ProgressBar, ProgressRing, Skeleton, LoadingCard, EmptyState, ErrorState
- Sobreposições: Tooltip, Dialog, ConfirmDialog, SaveGuard, Sheet, Menu, CommandPalette
- Navegação: SideNav, TopBar, TabBar, Tabs, Breadcrumbs, Pagination, Stepper, ProfileSwitcher, AppShell
- Dados: Card, StatCard, Avatar, AvatarGroup, DataTable, List, Timeline, DescriptionList, Accordion, MiniCalendar, BarChart, Sparkline
- Comunicação: AnnouncementCard, AnnouncementComposer, ReadReceipts, MessageThread, ConversationList, NotificationItem
- Financeiro: InvoiceCard, PixPayment, BoletoCard, TaxReceipt
- Pedagógico: ReportCard, AttendanceRoster, GradeEntry, GradeList, ClassPicker, DailyLog, StudentHeader, OccurrenceCard, ProgramTracker, IntegralBoard, RoutineEditor, AssignmentSubmit, StudentTimeline
- Agenda: AgendaList, AppointmentPicker
- Portaria e biblioteca: PickupCard, GateLog, BookCard, LoanItem
- Secretaria: PendingItem, EnrollmentChecklist
- Plataforma: LoginLayout, BrandPreview, BrandEditor, ModuleCard, PreferencesPanel, PermissionMatrix

### Módulos do produto e onde estão

| módulo | componentes |
| --- | --- |
| Comunicados | AnnouncementComposer, AnnouncementCard, ReadReceipts, NotificationItem |
| Chat | ConversationList, MessageThread |
| Boletos e mensalidades | InvoiceCard, BoletoCard, PixPayment |
| Recibos para Imposto de Renda | TaxReceipt |
| Portaria | PickupCard, GateLog |
| Biblioteca | BookCard, LoanItem |
| Boletim | ReportCard |
| Agenda e agenda online | AgendaList, AppointmentPicker, MiniCalendar |
| Ocorrências | OccurrenceCard |
| Matrícula e rematrícula | EnrollmentChecklist, Stepper, FileDrop |
| Acompanhamento regular, tempo integral, semi-integral e reforço | ProgramTracker, DailyLog |
| Digitação de notas e faltas | GradeEntry (com coluna de faltas), AttendanceRoster |
| Linha do tempo do aluno | StudentHeader, StudentTimeline |
| Grupos e permissões de funcionários | PermissionMatrix, ModuleCard |
| Indicadores da direção | StatCard, BarChart, DataTable |

### Regras que vieram das avaliações das lojas

Cada uma corrige uma reclamação recorrente nos apps escolares em uso hoje:

- Uma tela de "Hoje" com o que exige ação, em ordem de prazo (`PendingItem`), antes de qualquer feed.
- Comunicado com prioridade visível e confirmação de leitura; a escola vê quem leu e lembra quem não leu (`ReadReceipts`).
- Pagamento em dois toques, com Pix, boleto com segunda via e informe de IR no mesmo lugar.
- Troca de filho sem sair da tela (`ProfileSwitcher`), com o nome da criança em tudo que é dela.
- Chamada que funciona sem internet, digitação de notas que valida na hora e não perde o que foi digitado.
- Saída do aluno só com quem a família autorizou, com aviso no celular na hora (`PickupCard`).
- Erro e falta de internet sempre com saída (`ErrorState`), nunca tela em branco.

### Como o sistema cresce

Componente novo só entra quando o mesmo padrão aparece em duas telas diferentes; até lá ele vive na tela. Para entrar:

1. Procurar antes: se é variação de algo que existe, vira prop (`variant`, `size`, `tone`, `color`), não componente novo.
2. Só tokens. Nenhum hex, px solto, duração ou z-index escrito à mão; se falta um valor, ele entra primeiro em `tokens.json` com nota de uso.
3. Classes com prefixo `rc-`, nome do componente em inglês e PascalCase, textos e documentação em português.
4. Todos os estados desenhados: padrão, hover, foco, pressionado, desabilitado, carregando, vazio e erro.
5. Lista densa é zebrada; módulo novo ganha uma cor de categoria e a mantém em ícone, etiqueta e gráfico.
6. Funciona nos quatro temas, com texto em 200%, com espaçamento amplo, só no teclado e com leitor de tela.
7. Entrega junto: fonte em `components/src`, tipos em `index.d.ts`, `README.md` com quando usar e quando não usar, `preview.html` com dados do Colégio Recreio.
8. Grupo de módulo só para o que carrega regra da escola; o genérico vai para o grupo genérico.

## Logos

A logo do Recreio Sistema Educacional é o R formado por três peças (azul, amarelo e verde), com o nome e o slogan. Arquivos e regras no grupo Logos. Ainda é um primeiro conceito: falta o vetorial, a versão monocromática e o teste do ícone reduzido antes de virar identidade definitiva.

## Demo: Colégio Recreio

Escola fictícia usada em todos os exemplos e na apresentação comercial. Os dados são inventados; CNPJ de exemplo `11.222.333/0001-81`.

| item | valor |
| --- | --- |
| Escola | Colégio Recreio, Fortaleza/CE, unidades Aldeota e Eusébio |
| Alunos | 1.248, da Educação Infantil à 3ª série do Ensino Médio; 1.086 famílias |
| Mensalidade 2026 | Infantil R$ 1.290,00; Fundamental I R$ 1.480,00; Fundamental II R$ 1.620,00; Ensino Médio R$ 1.890,00; 5% de desconto até o dia 10 |
| Indicadores de novembro | R$ 1.924.380 recebidos, inadimplência de 5,8%, 812 rematrículas para 2027, frequência de 96,8% |
| Direção | Lúcia Menezes |
| Coordenação | Juliana Sampaio (Fundamental II), Patrícia Rocha (Infantil) |
| Secretaria e financeiro | Renata Alencar |
| Professores | Helena Costa (Português), Ricardo Albuquerque (Matemática), Marcos Vinícius Teixeira (Ciências), Luana Freitas (Geografia), Tatiane Freitas (Inglês), Débora Lins (2º ano) |
| Família principal | Fernanda Lima (mãe, responsável financeira) e Rodrigo Lima (pai); filhos Davi Lima (2º ano B, tempo integral e reforço) e Ana Beatriz Lima (9º ano A, semi-integral) |
| 9º ano A | Ana Beatriz Lima, Arthur Nogueira, Bruno Sales, Caio Reis, Davi Martins, Larissa Bezerra, Isabela Fontenele, João Pedro Cavalcante |
| Outros alunos | Gabriela Moreira (1ª série EM), Sofia Araújo (7º ano A), Mateus Holanda (9º ano C) |
| Educação infantil | Maria Clara Pinheiro, Infantil V |


## App nativo (iOS e Android)
- As telas do app usam o mesmo `.rc-app` do PWA (390x844, status, rolagem interna, `TabBar`) e as classes `rc-nat-*` para o padrão nativo.
- Navegação: `rc-nat-nav` com `rc-nat-navrow` (voltar e ações em `rc-nat-iconbtn`, contador em `em`), título grande `rc-nat-title`, subtítulo `rc-nat-sub` e busca `rc-nat-search`. Formulários e conversas usam a barra compacta `rc-app-bar`.
- Conteúdo em `rc-nat-body`. Listas agrupadas: `rc-nat-glabel`, `rc-nat-list` com `rc-nat-item` (ícone colorido `rc-nat-ico rc-c-<cor>`, texto, `rc-nat-end` com valor e seta) e nota `rc-nat-gnote`. Separador recuado como no iOS.
- Números em `rc-nat-kpis` e `rc-nat-kpi rc-c-<cor>`. Filtros em `rc-nat-chips`. Ação de deslizar em `rc-nat-swipe` com `rc-nat-act`. Destaque em `rc-nat-card is-hero`.
- Câmera: `rc-nat-cam`, `rc-nat-frame` (`is-face` para rosto), `rc-nat-camtop`, `rc-nat-cambottom`, `rc-nat-shutter`. Tela bloqueada com notificações: `rc-nat-lock`, `rc-nat-clock`, `rc-nat-push`. Face ID: `rc-nat-face`. Onboarding: `rc-nat-dots`.
- Ação fixa no rodapé: `rc-app-cta`. Confirmação e formulário curto: folha `rc-popup is-sheet`.
- Escopo do app: só o que pede notificação na hora, câmera, QR, biometria, localização ou uso rápido. O restante abre no portal web (PWA) dentro do app, marcado com `rc-nat-portal` na tela Mais de cada perfil.
- Cabeçalho da marca: `rc-nat-nav` usa `--nav` com título branco e canto inferior arredondado, e a barra de status acompanha a cor. A linha de voltar some quando não há voltar nem ação.
- Perfis com app: Responsável, Aluno, Professor, Portaria e Gestão (direção, coordenação e financeiro). Secretaria, biblioteca, nutrição e enfermaria usam o portal web.
- Seletor que troca o conteúdo: `rc-nat-views` com chips `label.rc-nat-chip` (rádio escondido, `value` de 1 a 7) e painéis `data-view`. O painel e o chip que nascem abertos levam `data-default` e `is-def`. Funciona sem script.
- Barra compacta no app: `rc-app-bar` dentro de uma tela com `rc-nat-body` recebe a cor da marca. Câmera e tela bloqueada também pintam a barra de status.
- Volta ao app: quem abre o portal web a partir do app vê a pílula `rc-nat-return` (Voltar ao app) no topo. O `RecreioProvider` guarda só o nome da tela de origem na sessão do navegador.
