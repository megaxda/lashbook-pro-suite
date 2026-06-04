## Próximas melhorias: Clientes + Financeiro

Mesma filosofia que aplicamos na Agenda: mais visual, mais funcional, busca/ordenação consistentes e detalhes que reduzem cliques no dia a dia. Apenas frontend, sem mudança de banco.

---

### A. Clientes (`ClientesTab.tsx`)

1. **Busca e ordenação padronizadas**
   - Mesma lógica do `ClientCombobox`: normalização de acentos, case-insensitive, match multi-token (split por espaço) em nome, telefone e email.
   - Ordem alfabética pt-BR (`localeCompare`, `sensitivity: base`) como padrão.
   - Opção de ordenar por: A–Z, Mais recente, Último atendimento, Aniversário próximo.

2. **Filtros rápidos (chips no topo)**
   - Todas · Ativas · Inativas · Aniversariantes do mês · Sem retorno há X dias (usa `profiles.follow_up_days`).
   - Contador ao lado de cada chip.

3. **Cards de cliente mais informativos**
   - Foto/avatar + Nome (negrito).
   - Linha 2: telefone clicável (WhatsApp `wa.me`) + email.
   - Linha 3: badges — “Última visita: dd/mm”, “Próximo agendamento: dd/mm HH:mm”, “Aniversário 🎂 dd/mm” (quando no mês).
   - Indicador colorido à esquerda: verde (em dia), âmbar (sem retorno), cinza (inativa).

4. **Ação rápida “Novo agendamento” direto do card**
   - Botão que já pré-seleciona o cliente e abre o modal de novo agendamento (mesmo modal de `AgendamentosTab`).

5. **Detalhe do cliente (drawer/dialog)**
   - Cabeçalho com foto, nome, telefone (WhatsApp), email, aniversário.
   - Abas: Histórico de atendimentos · Financeiro (total gasto, ticket médio) · Fichas · Notas.
   - Botões: Editar · WhatsApp · Novo agendamento · Excluir.

6. **Aniversariantes do mês**
   - Pequeno bloco no topo com lista compacta + atalho “Parabenizar via WhatsApp” usando template pré-pronto.

---

### B. Financeiro (`FinanceiroTab.tsx`)

1. **Período selecionável no topo**
   - Chips: Hoje · 7 dias · Mês atual · Mês anterior · Personalizado (date range).
   - Todos os KPIs e gráficos recalculam pelo período.

2. **KPIs aprimorados**
   - Receita, Despesa, Lucro, Ticket Médio (já existem) + **A receber** (sinais pagos de agendamentos futuros) e **Atendimentos no período**.
   - Mini-trend (sparkline) ao lado de cada KPI comparando com período anterior (▲/▼ %).

3. **Gráfico principal: barra dupla por dia/semana**
   - Eixo X: dias do período · barras Receita (verde) vs Despesa (vermelha) · linha de Lucro.
   - Substitui o pie atual como gráfico primário; pie vira secundário (distribuição por categoria).

4. **Distribuição por categoria**
   - Pie/donut só de despesas por categoria + lista lateral com % e valor.
   - Outro pie para receitas por forma de pagamento (PIX / Dinheiro / Cartão) — usa `forma_pagamento` e `pagamentos_detalhe` dos agendamentos concluídos.

5. **Tabela única de lançamentos**
   - Unificar Receitas/Despesas em uma única tabela com filtros (tipo, categoria, busca por descrição).
   - Coluna “Origem”: badge “Agendamento” quando vier de `auto_create_receita_on_concluido`, “Manual” caso contrário. Lançamentos de agendamento não podem ser editados/excluídos por aqui (orienta a abrir o agendamento).
   - Ordenação por data (padrão) ou valor.
   - Paginação simples (20 por página) para evitar tabelas longas.

6. **Exportação CSV**
   - Botão “Exportar período” gera CSV com data, tipo, descrição, categoria, valor.

7. **Comparativos mensais (bloco final)**
   - Mini tabela últimos 6 meses: Receita · Despesa · Lucro · Margem %.

---

### Fora do escopo
- Mudanças de schema/migrações.
- Integrações de pagamento (Stripe/Mercado Pago).
- Relatórios em PDF.
- Recorrência de despesas (fica para próxima iteração se quiser).

### Arquivos a alterar
- `src/components/modules/ClientesTab.tsx`
- `src/components/modules/FinanceiroTab.tsx`
- `src/components/ui/ClientCombobox.tsx` (reaproveitar helpers de normalização/ordenação para Clientes)
- Eventual `src/lib/dateUtils.ts` (helpers de período) e `src/lib/searchUtils.ts` (normalização compartilhada)

### Ordem sugerida
1. Clientes: busca/ordenação + filtros + cards informativos + drawer de detalhe.
2. Financeiro: seletor de período + KPIs com trend + gráfico de barras + tabela unificada + exportação CSV + comparativo mensal.

Confirma este escopo para eu implementar?