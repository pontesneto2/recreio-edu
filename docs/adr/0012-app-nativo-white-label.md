# 0012. App nativo white label: um app Recreio com marca dinâmica, app próprio como plano pago

- Status: aceita
- Data: 2026-11-27

## Contexto

As escolas querem o app com a própria marca. Publicar um app por escola nas lojas tem custo alto:

- A Apple aceita app gerado de modelo só se publicado na conta de desenvolvedor do próprio cliente (diretriz 4.2.6 da App Store). Cada escola precisaria de conta Apple, conta Google Play, revisão e publicação próprias.
- Cada app separado multiplica builds, versões nas lojas e chaves de push.

## Decisão

Duas camadas, um só código em `apps/mobile` (Expo com React Native):

1. **App Recreio (padrão, todos os planos).** Um app nas lojas com o nome Recreio. Na primeira abertura, a pessoa entra com o e-mail; o app lista as escolas onde ela tem vínculo e aplica cor, logo e vocabulário da escola escolhida. Um código ou QR enviado pela escola também leva direto a ela. A troca de escola fica no menu, sem novo login.
2. **App próprio da escola (plano pago).** Mesmo código, build com nome, ícone, cores e escola fixa. Configuração em `app.config.ts` lida de um arquivo por escola (`apps/mobile/escolas/<slug>.json`). Builds pelo EAS Build com perfil por escola, publicados na conta de desenvolvedor da escola. Atualizações de JavaScript chegam a todos os apps pelo EAS Update, sem nova revisão de loja.

Em comum:

- O app só abre o que precisa de recurso nativo (push, câmera, QR, biometria, uso rápido). O resto abre o portal da escola, como define o protótipo.
- Push por Expo Notifications (APNs e FCM), com token registrado por usuário, escola e aparelho.
- Login com o mesmo Better Auth da web; passkey e biometria para reabrir.

## Consequências

- Uma única revisão de loja atende todas as escolas no plano padrão.
- O app próprio custa ao cliente a conta Apple e Google e é cobrado como adicional.
- O CI ganha uma matriz de builds só para escolas com app próprio.
