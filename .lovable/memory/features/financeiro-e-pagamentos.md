---
name: Financeiro e Pagamentos
description: Dashboard com período, KPIs com trend, gráfico Receita vs Despesa, tabela unificada, exportação CSV, comparativo 6 meses
type: feature
---
- Período selecionável: Hoje, 7 dias, Mês atual, Mês anterior, Personalizado (range).
- KPIs: Receita, Despesa, Lucro, Ticket Médio, Lançamentos receita, Atendimentos concluídos.
  - Cada KPI mostra trend (▲/▼ %) vs período anterior equivalente.
  - Despesa usa trend invertido (queda = positivo).
- Gráfico principal: ComposedChart com barras Receita (verde) + Despesa (vermelha) + linha Lucro (azul) por dia.
- Despesas por categoria: PieChart + lista lateral com R$ e %.
- Tabela unificada (Receitas + Despesas) com filtros: tipo, categoria, busca multi-token, ordenação (data/valor asc/desc), paginação 20/pg.
- Coluna "Origem": badge "Agendamento" (vindo de `auto_create_receita_on_concluido`, tem `agendamento_id`) ou "Manual". Lançamentos de agendamento não podem ser editados/excluídos pela tela financeira — precisam ser ajustados pelo próprio agendamento.
- Exportação CSV: respeita os filtros atuais da tabela, formato pt-BR com BOM UTF-8 (`;` como separador).
- Comparativo últimos 6 meses: tabela com Receita / Despesa / Lucro / Margem %.
- Pagamentos fracionados continuam suportados (lidos de `pagamentos_detalhe`).
- Controle de sinal continua via `agendamentos.sinal_pago` + `comprovante_url`.
