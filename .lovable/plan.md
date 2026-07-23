# Limpeza mobile — esconder o que não faz diferença

Objetivo: em telas <lg (mobile/tablet pequeno) mostrar só o essencial. Nada de tabelas largas, chips redundantes, subtítulos decorativos, ações secundárias. Todas as funcionalidades continuam disponíveis — só ficam escondidas atrás do FAB, do drawer "Mais" ou do card já existente.

## Regra geral
- Usar utilitários Tailwind `hidden lg:...` / `lg:hidden` — sem novo componente.
- Nunca esconder ação principal (Novo/Salvar). Esconder apenas o que é redundante com bottom-nav, FAB ou o próprio card.
- Manter todos os dados acessíveis: se esconder coluna, o card compacto mobile já mostra a info.

## Ajustes por tela

### PageHeader (`src/components/ui/kpi-card.tsx`)
- Subtítulo (`subtitle`) escondido no mobile (`hidden sm:block`).
- Título reduzido no mobile: `text-xl sm:text-2xl` já ok, mas remover tracking/peso excessivo.
- `actions` viram wrap compacto; botões com texto viram só ícone no mobile via `sm:inline`/`inline sm:hidden` nos labels.

### Dashboard (`DashboardTab.tsx`)
- KPIs: no mobile, grid 2 col já ok — esconder KPIs secundários "Estoque baixo" e "Para retornar" no mobile (`hidden sm:block`) porque aparecem depois nos cards de alerta/lista.
- Card "Receita dos últimos 7 dias": esconder eixo Y e legendas repetidas; manter só barras + tooltip.
- Segmented Diário/Semanal/Mensal dentro da SectionCard Agenda: no mobile deixar só Diário e Semanal (esconder Mensal — pouco útil em 393px).
- Legenda de status: colapsar em `<details>` no mobile.

### Financeiro (`FinanceiroTab.tsx`)
- Toggle "Negócio | Pessoal": manter (essencial).
- Chips de período: esconder "Mês anterior" e "Personalizado" no mobile (drop dentro de um "Mais" menu ou popover) — deixar Hoje / 7 dias / Mês.
- Intervalo de datas textual (`01/07/2026 → 31/07/2026`): `hidden sm:inline`.
- Botão CSV: esconder no mobile (`hidden sm:inline-flex`) — export é ação desktop.
- KPI grid: no mobile mostrar só Receita, Despesa, Lucro (esconder Ticket Médio, Lançamentos, Atendimentos com `hidden sm:block`).
- Gráfico "Receita vs Despesa": manter; esconder subtítulo "Evolução diária no período" no mobile.
- Tabela de lançamentos: no mobile virar lista de cards (já é o padrão em `renderRow`?) — se ainda é `<table>`, esconder colunas Profissional, Categoria, Origem via `hidden md:table-cell`.
- "Últimos 6 meses": esconder no mobile inteiro (`hidden lg:block`) — comparativo é análise desktop.

### Clientes (`ClientesTab.tsx`)
- Subtítulo "8 cadastradas": manter (é curto).
- Chips de filtro: no mobile manter só "Todas / Ativas / Aniversariantes" — esconder "Inativas" e "Sem retorno 30d+" atrás de um botão "Filtros" ou `hidden sm:inline-flex`.
- Select de ordenação: `hidden sm:flex` no mobile (busca resolve).
- Cards de cliente: esconder email no mobile (só nome + telefone + badge última visita). Ações secundárias (WhatsApp, menu) já são ícones — ok.

### Agendamentos (`AgendamentosTab.tsx`)
- Subtítulo "5 agendamentos": `hidden sm:block`.
- Segmented Lista/Diário/Semanal/Mensal: no mobile deixar Diário + Semanal + Lista (esconder Mensal).
- Botão "Bloquear": `hidden sm:inline-flex` no mobile — mover para dentro do FAB "+" como opção secundária, ou dentro do modal de novo.
- Botão "Novo": já escondido no mobile (FAB assume).
- Filtro por profissional: manter chips mas com scroll horizontal (`overflow-x-auto`) — ok.
- Legenda de status colorida: no mobile colapsar em `<details>` "Legenda".
- Header de data (`qui., 23 de jul. de 2026`): encurtar no mobile para `23 jul.` via toLocaleDateString responsivo.

## Fora de escopo
- Nenhuma mudança de lógica, dados, queries, RLS.
- Sem novos componentes; só utilitários responsivos e pequenas variações de props.

## Verificação
Após aplicar, capturar as 4 telas em 393px via Playwright e comparar antes/depois; typecheck via tsgo.
