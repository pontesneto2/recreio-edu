# TextField

Campo de texto com rótulo, ajuda, erro, sucesso, ícone e sufixo.

**O consumidor fornece:** `label` (sempre visível, nunca só placeholder), `hint`, `error` (diz o que fazer, não só que errou), `success`, `required` ou `optional` (escritos por extenso), `icon`, `suffix`, `maxLength` (mostra contador), `type`.

- Erro com ícone e texto; a cor nunca carrega a informação sozinha.
- `type="password"` ganha botão de mostrar senha; colar senha é sempre permitido.
- Texto de campo em 16 px para o celular não dar zoom.
