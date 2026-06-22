## Sempre mostrar horário início–fim baseado na duração do serviço

Hoje o bloco só mostra o intervalo (`HH:MM–HH:MM`) quando `servicos.duracao` está preenchido; quando o serviço não tem duração cadastrada, aparece só a hora inicial. Além disso, ao calcular `endStr` usamos fallback de 60 min, mas a condição de render exige `duracao` truthy — inconsistência.

### Mudança
Em `src/components/agenda/AgendaGrid.tsx` (`ApptBlock`):
- Calcular `dur = a.servicos?.duracao || 60` (já existe) e sempre exibir `HH:MM–HH:MM` na linha de horário, mesmo quando a duração vier do fallback.
- Garantir que o bloco renderizado na agenda use a mesma `dur` para a altura (já é o caso em `layoutDay`/`layoutWeek`), de modo que o tamanho do bloco corresponda ao gap real do serviço.

Sem alterações de banco de dados ou em outros componentes.
