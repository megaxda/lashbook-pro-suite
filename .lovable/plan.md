## Exibir horário de início e fim nos agendamentos

Atualmente os blocos de agendamento na agenda (diária/semanal) mostram o nome do cliente, hora de início e — em uma linha separada — o serviço. A referência enviada mostra um layout mais claro: **nome + serviço na primeira linha** e **HH:MM – HH:MM (início–fim) destacado logo abaixo**.

### Mudanças
Em `src/components/agenda/AgendaGrid.tsx`, no componente do card de agendamento (`ApptBlock`):

1. **Linha 1** — Cliente, opcionalmente com o serviço ao lado (ex.: `Ingrid Oliveira - ext y`), com `truncate`.
2. **Linha 2** — Intervalo de horário sempre visível e em destaque: `08:15 – 09:50`, calculado a partir de `a.horario` + `servicos.duracao` (já existe a variável `endStr`). Quando não houver duração cadastrada, mostrar apenas a hora de início.
3. Remover a linha extra de serviço quando ele já couber junto ao nome, evitando duplicidade.
4. Manter o comportamento de blocos altos vs. compactos: em blocos muito baixos, mostrar apenas a linha de horário (que é a informação principal pedida).

Sem alterações no banco de dados, em outros componentes ou no fluxo de criação/edição — somente apresentação visual do bloco.
