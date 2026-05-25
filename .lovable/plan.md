## Objetivo

Tornar bloqueios visíveis em toda a agenda, suportar recorrência de bloqueios, criar agendamentos recorrentes para clientes fixas e deixar clara a opção de cortesia/retorno gratuito.

## 1. Bloqueios visíveis em todos os lugares

**Aba Agendamentos**
- Lista: incluir os bloqueios entre os agendamentos do dia, com badge "Bloqueio" cinza e o motivo. Clicar abre um pequeno diálogo para editar motivo/horário ou excluir.
- Diário/Semanal: renderizar os bloqueios como faixas cinza listradas no grid de horários (full-day cobre o dia inteiro, parcial cobre só o intervalo).
- Mensal: nas células do mês, mostrar um chip cinza "🚫 Bloqueado" (ou o motivo encurtado) junto dos agendamentos.

**Dashboard (tela inicial)**
- Diário: mostrar bloqueios do dia como cartões cinza listrados.
- Semanal/Mensal: aplicar a mesma marcação visual cinza usada na aba Agendamentos (faixa no grid semanal, chip no mensal).
- No modal do dia: listar bloqueios acima dos agendamentos.

**Link da Bio**
- Já há `get_blocked_slots_by_slug`. Garantir que, quando `dia_todo` estiver ativo, o seletor de data trate a data como indisponível (mensagem "Agenda fechada nesta data" já aparece — desabilitar todos os slots fica reforçado). Sem alteração de schema, só ajuste visual no `LinkBioPage` para impedir o passo seguinte quando `allDayBlocked`.

## 2. Recorrência de bloqueios

Acrescentar ao diálogo "Bloquear" (em Agendamentos e Dashboard) os campos:

- **Recorrência**: Única / Semanal / Quinzenal / Mensal
- **Repetir até**: data limite (obrigatório quando recorrência ≠ Única)

Comportamento:
- Única: insere um único registro (igual a hoje).
- Semanal: replica a cada 7 dias até a data limite.
- Quinzenal: a cada 14 dias.
- Mensal: mesmo dia do mês até o limite (pulando meses sem o dia equivalente).

Todos os bloqueios gerados compartilham um `recorrencia_id` (uuid) para que possamos oferecer "Excluir só este" ou "Excluir toda a série" ao remover.

## 3. Agendamentos recorrentes (clientes fixas)

No diálogo "Novo Agendamento" adicionar uma seção opcional "Cliente fixa / recorrente":

- **Recorrência**: Nenhuma / Semanal / Quinzenal / Mensal
- **Repetir até**: data limite

Ao salvar, cria N agendamentos com o mesmo cliente, serviço, horário e status pendente, marcados com um `recorrencia_id` compartilhado. Bloqueios são respeitados: datas conflitantes são puladas e listadas em um toast informativo ao final.

Edição/exclusão segue a mesma lógica de série: ao excluir/editar, perguntar "Apenas este" ou "Toda a série".

## 4. Cortesia / Retorno sem custo

O campo `gratuito` já existe. Vamos torná-lo explícito:

- No diálogo de Novo Agendamento e na edição, substituir o checkbox por um seletor de **Tipo de cobrança**:
  - Pago (padrão, mostra formas de pagamento)
  - Cortesia / Retorno sem custo (zera o valor, oculta formas de pagamento, não gera receita no financeiro)
- Quando "Cortesia" estiver marcado, o card do agendamento mostra um badge verde-claro "Cortesia" e o valor aparece como "R$ 0,00".
- A trigger `auto_create_receita_on_concluido` já ignora `gratuito = true`, então não há alteração no financeiro.

## Detalhes técnicos

**Migração de banco**
- `ALTER TABLE bloqueios_agenda ADD COLUMN recorrencia_id uuid` (índice em `recorrencia_id`).
- `ALTER TABLE agendamentos ADD COLUMN recorrencia_id uuid` (índice).
- Sem alteração no `gratuito` (já existe).

**Frontend (sem novas libs)**
- `src/components/modules/AgendamentosTab.tsx`: estender `bloqForm` com `recorrencia` + `repetir_ate`; estender `newForm` idem; helper `expandRecorrencia(dataInicial, tipo, ate)` que devolve lista de datas; loop de inserts; render dos bloqueios na Lista/Diário/Semanal/Mensal; diálogo de confirmação "Este ou toda a série".
- `src/components/modules/DashboardTab.tsx`: buscar `bloqueios_agenda` junto com `agendamentos`; renderizar faixas cinza no Semanal/Mensal e no modal do dia.
- `src/pages/LinkBioPage.tsx`: quando `allDayBlocked`, desabilitar botão "Continuar" e exibir a mensagem já existente em destaque.

## Fora do escopo

- Edição em lote de várias séries simultaneamente.
- Notificação automática a clientes fixas (continua usando o WhatsApp manual).
