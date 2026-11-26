# Button

Botão de ação. Diminui levemente ao pressionar e mostra carregamento no próprio botão.

**Variantes:** `primary` (a ação para a qual a tela existe; no máximo uma por área), `secondary` (padrão), `ghost` (ações de apoio em barras e cartões), `danger` (destrutiva, sempre com confirmação), `link`.

**O consumidor fornece:** o texto (verbo primeiro, frase curta: "Pagar com Pix", nunca "Clique aqui"), `icon` ou `iconRight`, `size` (sm, md, lg), `loading` com `loadingLabel` ("Enviando"), `full` para ocupar a largura.

- Em telas de toque o botão cresce para 48 px sozinho.
- Durante `loading` o botão fica desabilitado e anuncia o estado para leitor de tela.
- Não faça: dois primários lado a lado, texto em caixa alta, botão só com ícone (use IconButton).
