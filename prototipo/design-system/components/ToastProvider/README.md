# ToastProvider

Aviso rápido no canto da tela: confirma o que acabou de acontecer, com desfazer quando der.

**Como usar:** `const toast = useToast(); toast.show({ tone, title, message, action })`. O RecreioProvider já inclui o ToastProvider.

- Some sozinho em 4,5 s (7 s com ação). Pausa com o mouse em cima.
- Entra subindo e sai deslizando; sem animação com movimento reduzido.
- Não faça: usar toast para erro que exige decisão (use Alert ou Dialog).
