# StudentTimeline

Linha do tempo do aluno: tudo o que aconteceu com ele num só fio, agrupado por mês. Notas, faltas, ocorrências, elogios, atendimentos, saúde, matrícula e financeiro, cada tipo com cor e ícone, com filtro e contagem por tipo.

**O consumidor fornece:** `events` (`month`, `date`, `kind`: nota, falta, ocorrencia, atendimento, elogio, saude, matricula, financeiro; `title`, `meta`).

- É a aba principal da ficha do aluno (StudentHeader + StudentTimeline).
- Saúde e financeiro só aparecem para perfis com essas permissões.
