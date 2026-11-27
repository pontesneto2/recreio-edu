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
- `design-system/`: README, tokens e documentação por componente. O código dos componentes está em TypeScript em `packages/design-system`.
- `docs/dados-canonicos.md`: datas, nomes, valores e regras de negócio usados em todas as telas.

## Para o projeto real
- Os componentes estão em `packages/design-system`, em TypeScript, com CSS próprio (`rc-*`) e os mesmos tokens.
- Cada `.dc.html` traz os dados de exemplo no método `renderVals()`: use como contrato de dados da API.
- O app nativo cobre só o que precisa de push, câmera, QR, biometria, localização ou uso rápido. O resto abre no portal PWA.
