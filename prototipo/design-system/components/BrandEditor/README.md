# BrandEditor

Manual da marca da escola dentro do sistema. A direção define identidade, logos, cores, tipografia e os dados que vão nos documentos, vê a prévia ao vivo e salva. Ao salvar, a marca vale para o sistema inteiro.

**O consumidor fornece:** `defaults` (marca padrão da escola: `name`, `short`, `slogan`, `primary`, `secondary`, `accent`, `navStyle`, `font`, `radius`, `logo`, `logoDark`, `symbol`, `legalName`, `cnpj`, `address`, `phone`, `site`, `act`, `signer`, `signerRole`, `headerAlign`, `watermark`, `footer`, `qr`) e `onSave`.

- Identidade: nome, nome curto, frase da escola e três logos (principal, fundo escuro e símbolo). Aceita PNG, JPG, SVG ou WebP até 400 KB. Sem logo, usa as iniciais.
- Cores: primária (botões e links), secundária (menu e cabeçalho de documento) e destaque (selos e item ativo). Há seis paletas prontas. O sistema ajusta os tons e mostra o contraste de cada par.
- Tipografia e formas: fonte padrão, arredondada ou títulos com serifa; cantos retos, suaves ou arredondados.
- Dados para documentos: razão social, CNPJ (validado com 14 dígitos), endereço, contato, ato de autorização, quem assina, alinhamento do cabeçalho, marca d'água, rodapé e QR de autenticidade.
- Prévia ao vivo: sistema web, app das famílias, documento e login com e-mail.
- Salvar pede confirmação e chama `saveBrand`. O `RecreioProvider` de cada tela lê a marca salva (`loadBrand`) e aplica cores, fonte e cantos. `SideNav` e `LoginLayout` trocam nome e logo. Documentos leem os dados legais com `loadBrand()`.
- Restaurar padrão apaga a marca salva, com confirmação. Documentos já assinados não mudam.
- Hex inválido, nome vazio ou CNPJ incompleto bloqueiam o botão Salvar e mostram o erro no campo.
