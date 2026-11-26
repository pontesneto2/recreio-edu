# Logos

Logo do Sistema Recreio: o R formado por três peças (azul, amarelo e verde), o nome "Sistema Recreio" e o slogan "Toda a escola. Em um só lugar." É o primeiro conceito enviado pelo cliente; os arquivos abaixo são o mesmo desenho com o fundo branco removido.

| arquivo | quando usar |
| --- | --- |
| `recreio-logo.png` | fundo claro (`surface-0`, `surface-1`, branco). Logo completa com slogan. |
| `recreio-logo-negativo.png` | fundo marinho ou escuro (`nav`, tema escuro). Só o marinho do texto virou branco; as peças mantêm as cores. |
| `recreio-simbolo.png` | só o R: favicon, avatar da plataforma, carregamento, identificação de módulos. |
| `recreio-icone-app.png` | ícone do PWA e da loja, 1024 px, símbolo sobre placa branca com margem de segurança. Exportar em 192, 512 e versão maskable. |

Regras:

- Dentro do sistema de uma escola aparece a marca da escola (`SchoolMark`) e o Recreio vira texto: "Feito por Sistema Recreio" (`MadeBy`). A logo aparece na vitrine da entrada, no site e no painel da plataforma.
- No código, use o componente `Logo` (`variant="full"` ou `"inline"`, `tone="cor"` ou `"negativo"`); ele já carrega estes arquivos.
- Tamanho mínimo: símbolo com 20 px em tela; logo completa com 120 px de largura.
- Não redesenhar o símbolo, não trocar a cor das peças, não aplicar sombra, contorno ou outro degradê, não colocar sobre foto sem placa.

Pendências antes de virar identidade definitiva:

- Arquivo vetorial (SVG ou AI) do símbolo e do nome.
- Versão monocromática (uma cor) para carimbo, documento e impressão.
- Teste do símbolo abaixo de 24 px: a parte marinha do R perde contraste sobre o fundo `nav`.
- Registro: consultar o INPI antes de investir em material institucional.
