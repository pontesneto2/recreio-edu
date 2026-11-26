# SegmentedControl

Escolha entre 2 a 5 opções que mudam a visão da mesma informação. O marcador desliza até a opção escolhida.

**O consumidor fornece:** `options` (`value`, `label`, `icon` opcional), `value`, `onChange`, `label` para leitor de tela, `full` para ocupar a largura.

- Setas do teclado trocam a opção.
- Não faça: usar para navegar entre páginas (use Tabs) nem para mais de 5 opções (use Select).
