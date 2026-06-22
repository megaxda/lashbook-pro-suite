## Ajustar layout do bloco de agendamento (3 linhas)

A versão atual juntou cliente e serviço na mesma linha. A referência mostra **três linhas separadas**:

1. **Linha 1** — Nome do cliente em negrito (ex.: `Ingrid Oliveira`).
2. **Linha 2** — Intervalo de horário (ex.: `08:15–09:55`).
3. **Linha 3** — Nome do serviço em itálico (ex.: `Aplicação do Volume Y`).

### Mudança
Em `src/components/agenda/AgendaGrid.tsx`, no componente `ApptBlock`:
- Remover a concatenação `cliente - serviço` da linha 1.
- Manter linha de horário como segunda linha.
- Restaurar a terceira linha com o nome do serviço em itálico (quando houver e o bloco tiver altura suficiente).

Sem outras alterações.
