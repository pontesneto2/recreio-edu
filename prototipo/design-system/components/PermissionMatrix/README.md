# PermissionMatrix

Grupos de funcionários e o que cada grupo pode fazer. A pessoa entra num grupo e herda as permissões dele. O quadro tem quatro seções por grupo: Módulos e ações, Pessoas, Restrições e Ver como.

**O consumidor fornece:** `groups` (`id`, `name`, `icon`, `color`, `description`, `members` como nome ou `{ name, role, also }`), `modules` (`id`, `name`, `icon`, `color`, `section`, `scopes`, `rules` com `id`, `label`, `hint`), `value` (grupo → módulo → ações), `scopes` (grupo → módulo → alcance), `rules` (grupo → módulo → regras ligadas), `restrictions` (grupo → restrições ligadas), `restrictionOptions`, `defaultGroup`, `defaultTab`, `defaultOpen`, `onSave`.

- Ações: ver, criar, editar, excluir, aprovar e exportar. Marcar qualquer ação liga Ver junto; desligar Ver tira todas. A chave Tudo liga ou desliga a linha.
- Módulos agrupados por `section` (Geral, Pedagógico, Secretaria, Financeiro, Gestão).
- A seta da linha abre o alcance (toda a rede, sua sede, seu segmento, suas turmas, só o que criou) e as regras específicas do módulo, como "Liberar notas para a família".
- Pessoas: lista com função, adicionar e remover. Uma pessoa pode estar em mais de um grupo; vale a soma.
- Restrições: horário, rede da escola, duas etapas, celular, máscara de documentos, dados de saúde, valores financeiros, exportação em lote e validade.
- Ver como: prévia do menu que o grupo vê, com alcance e ações por módulo.
- Novo grupo e Duplicar abrem um pop-up com nome e "copiar permissões de". Nome repetido é recusado.
- Alterações ficam pendentes, contadas na barra amarela, até Salvar permissões. Desfazer volta ao último salvo.
- Toda mudança de permissão fica no registro de auditoria com quem mudou e quando.
