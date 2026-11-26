# SchoolTheme

Aplica a cor da escola a uma área da tela, gerando brand, brand-strong, brand-soft, on-brand e brand-ink com contraste garantido.

**Quando usar:** o RecreioProvider já envolve o app inteiro com a cor da escola. Use SchoolTheme sozinho para prévias (painel de marca, lista de escolas de uma rede).

**O consumidor fornece:** `seed` (hex da cor da marca) e, opcionalmente, `mode` para forçar um tema.

**Regras do algoritmo (`schoolPalette`):**
- Se texto branco passa 4,5:1 sobre a cor original, a cor fica exatamente como a escola enviou.
- Cor clara (como amarelo) mantém o tom e usa texto escuro por cima, se passar 4,5:1.
- Se nada passar, o tom escurece no espaço OKLCH, mantendo matiz e saturação, até passar.
- `brand-ink` (texto na cor da marca) é sempre ajustado para 4,5:1 sobre o fundo; 7:1 nos temas de alto contraste.
- O tema escuro gera a versão clara da cor automaticamente.
