# RecreioProvider

Raiz obrigatória do produto: aplica as preferências de acessibilidade da pessoa, a cor da escola e o sistema de toasts.

**Quando usar:** uma vez, no topo da aplicação (layout raiz do Next.js).

**O consumidor fornece:** `seed` (cor principal da escola, hex), `theme` (claro, escuro, alto-contraste, alto-contraste-escuro), `initialPrefs` (vindas da conta da pessoa) e `onPrefsChange` (para salvar na conta e sincronizar entre aparelhos).

**Como funciona:** grava as preferências como atributos no `<html>` (`data-theme`, `data-spacing`, `data-font`, `data-motion`, `data-foco`, `data-leitura`) e o tamanho do texto no `font-size` raiz. Todo componente reage a esses atributos; nada precisa ser passado por prop.

- Hooks: `usePreferences()` lê e altera; `useToast()` mostra avisos rápidos.
