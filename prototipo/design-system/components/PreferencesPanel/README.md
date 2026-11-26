# PreferencesPanel

Painel "Acessibilidade e leitura": tema, tamanho do texto, espaçamento, fonte, leitura simples, movimento, modo foco, Libras, ouvir e tradução. A prévia muda na hora na tela ao lado, e Salvar preferências grava na conta.

**Como funciona:** lê e grava pelo `usePreferences()` do RecreioProvider. A barra do rodapé conta as alterações, tem Descartar (volta ao último estado salvo) e Salvar preferências (`onSave`), desabilitado até a primeira mudança. Sair com alteração pendente abre o aviso de saída.

- Oferecido no primeiro acesso e sempre no menu de perfil.
- O padrão já atende WCAG 2.2 AA e a ABNT NBR 17225; o painel acrescenta o que cada pessoa precisa.
