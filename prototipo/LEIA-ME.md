# Recreio Sistema Educacional: pacote do protótipo

173 telas (135 web/PWA e 38 do app nativo estratégico), design system e dados canônicos.

## Ver as telas localmente
```
cd visualizar
npx serve .
```
Abra o endereço mostrado. O `index.html` lista todas as telas por grupo.

## Pastas
- `visualizar/`: cada tela como HTML que abre no navegador (referência visual e de comportamento).
- `telas-fonte/`: os `.dc.html` originais de cada tela (estrutura, dados de exemplo e lógica de cada tela).
- `design-system/`: README, tokens, documentação por componente e `fonte/` com o código React (`core.jsx`, `inputs.jsx`, `modules.jsx`, `recreio.css`, etc.).
- `docs/dados-canonicos.md`: datas, nomes, valores e regras de negócio usados em todas as telas.

## Para o projeto real
- Os componentes do `design-system/fonte` são React com CSS próprio (`rc-*`); migre para o seu stack (Next.js) mantendo os tokens.
- Cada `.dc.html` traz os dados de exemplo no método `renderVals()`: use como contrato de dados da API.
- O app nativo cobre só o que precisa de push, câmera, QR, biometria, localização ou uso rápido. O resto abre no portal PWA.
