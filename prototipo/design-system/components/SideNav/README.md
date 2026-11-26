# SideNav

Navegação principal no desktop. O marcador do item ativo desliza até a nova seção.

**O consumidor fornece:** `school` (`name`, `unit`, `logo`), `groups` (`label` e `items` com `id`, `label`, `icon`, `count`, `urgent`), `active`, `onNavigate`, `collapsed`.

- Só aparecem os módulos ligados para a escola e para o perfil.
- Fundo marinho (`nav`), item ativo em `nav-2` com marcador amarelo (`accent`). Com SchoolTheme, o marinho vira a versão profunda da cor da escola.
- O rodapé mostra "Feito por Sistema Recreio" em texto.
- O nome do colégio fica numa faixa própria no topo, com fundo levemente mais claro; as opções vêm abaixo. Os rótulos dos grupos são brancos e discretos.
- Recolher: o botão redondo na borda direita deixa só os ícones (72 px) e abre de novo. A escolha fica salva no navegador e vale em todas as telas. Recolhido, cada ícone mostra o nome ao passar o mouse e os grupos viram uma linha fina. `collapsed` força o estado; `collapsible={false}` tira o botão.
