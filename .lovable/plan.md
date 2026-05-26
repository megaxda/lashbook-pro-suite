
## Ajustes na Agenda

### 1. Alinhamento dos horários no grid Semanal
**Problema:** As linhas das horas (07:00, 08:00...) estão desalinhadas com as células do grid porque o label da hora é renderizado no meio da linha enquanto a célula tem altura diferente.

**Correção em `DashboardTab.tsx` e `AgendamentosTab.tsx` (vista Semanal):**
- Padronizar altura de cada slot de hora (ex: 60px fixo).
- Renderizar a coluna de horas com a mesma altura por linha que o grid (`grid-rows-[repeat(15,60px)]`) e alinhar o texto no **topo** de cada célula (não no meio), exatamente na linha divisória.
- Garantir o mesmo `border-top` em ambos para evitar deslocamento de 1px acumulativo.

### 2. Mostrar motivo do bloqueio
**Hoje:** Aparece só "🚫 Bloqueado" ou faixa listrada sem texto.

**Correção:**
- Nos chips/faixas de bloqueio (Lista, Diário, Semanal, Mensal, modal do dia) exibir `motivo` quando existir (ex: "Almoço", "Folga"). Fallback: "Bloqueado".
- Aplicar em `AgendamentosTab.tsx` e `DashboardTab.tsx`.

### 3. Mostrar nome do procedimento no card semanal/mensal
**Hoje:** Só aparece nome da cliente + horário; o serviço só vê passando o mouse.

**Correção:**
- No bloco do agendamento (Semanal e Mensal) adicionar segunda linha com `servicos.nome` quando houver espaço (truncar com ellipsis). Em Mensal: chip mostra `HH:mm Cliente · Serviço` truncado.
- Manter tooltip no hover com info completa.

### 4. Seletor de cliente com busca + ordem alfabética
**Hoje:** `<Select>` simples com clientes na ordem do banco; sem busca eficaz.

**Correção em `AgendamentosTab.tsx` (diálogo Novo Agendamento) e replicar no diálogo do `DashboardTab.tsx`:**
- Substituir o `Select` de cliente por um **Combobox** com busca (usando `Command` + `Popover` do shadcn — já disponíveis).
- Listar clientes em **ordem alfabética** (`localeCompare` pt-BR, case-insensitive, ignorando acentos com `normalize('NFD')`).
- Busca por substring **em qualquer parte do nome** (ex: "paula" encontra "Ana Paula Duarte Gulias", "Ana Paula Silva", etc.), também ignorando acentos.
- Mesma visualização nas abas **Início** e **Agendamentos**.

## Arquivos a alterar
- `src/components/modules/AgendamentosTab.tsx`
- `src/components/modules/DashboardTab.tsx`

## Fora do escopo
- Mudanças no backend/schema.
- Mudanças nas demais visualizações (Lista, Diário) além das pequenas tocadas em #2.
