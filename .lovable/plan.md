## Refatoração UI/UX estilo iOS/iPadOS — FinBeauty

Objetivo: elevar toda a interface a padrão nativo Apple (clean, leve, tipografia SF, hierarquia forte, toques 44px+, safe areas, sem grade semanal ilegível no mobile) **sem alterar nenhuma cor existente**. Foco em componentes estruturais reais, não só CSS.

---

### 1. Catálogo de cores (imutáveis)

Antes de tocar em qualquer componente, congelar em comentário no `src/index.css`:
- `--background 0 0% 98%`, `--foreground 0 0% 10%`
- `--primary 0 76% 42%` (vermelho #bd1a1b), `--primary-foreground 0 0% 100%`
- `--secondary/muted 0 0% 93%`, `--muted-foreground 0 0% 45%`
- `--accent 0 60% 38%`, `--destructive 0 62% 50%`
- `--border/input 0 0% 85%`
- Sidebar tokens, brand-glow/soft/muted, success/warning/info
- Status agenda: `--block`, `--status-confirmed/pending/inprogress/done/canceled/confirmar`
- Gradientes `.gradient-brand` e `.text-gradient-brand`

Regra: nenhum HSL/HEX é editado; só se muda o **uso**.

---

### 2. Sistema visual (tokens novos, sem tocar cor)

**Fonte** (`src/index.css`): substituir `Plus Jakarta Sans` por stack Apple:
```
-apple-system, BlinkMacSystemFont, "SF Pro Display", "SF Pro Text",
"Helvetica Neue", Arial, sans-serif
```
Remover import Google Fonts. Ativar `font-feature-settings: "ss01","cv11"` e `-webkit-font-smoothing: antialiased`.

**Escala tipográfica** (novas classes utilitárias em `@layer components`, substituindo `.t-*` atuais):
- `.ios-caption` 11px / regular (metadados raros)
- `.ios-footnote` 13px / regular (labels, auxiliares)
- `.ios-body` 15px / regular (corpo, inputs)
- `.ios-callout` 16px / medium (botões, controles)
- `.ios-headline` 17px / semibold (títulos de seção, linha 1 de cards)
- `.ios-title3` 20px / semibold
- `.ios-title2` 22px / bold
- `.ios-title1` 28px / bold (títulos de tela)
- `.ios-largetitle` 34px / bold (números destacados só)

Eliminar todo `text-[9px]`, `text-[10px]`, `text-xs` para elementos funcionais (rebusca com rg e substitui por `ios-footnote`/`ios-caption`).

**Espaçamento**: apenas múltiplos de 4 → normalizar `p-3.5`, `gap-1.5`, `py-2.5` para 8/12/16/20/24/32.

**Raios** (tokens em `:root`):
- `--radius-card: 16px`, `--radius-control: 12px`, `--radius-pill: 999px`
- Ajustar `.rounded-*` nos componentes: cards `rounded-2xl`, inputs/botões `rounded-xl`, badges `rounded-full`.

**Sombras** (novas, discretas):
- `--shadow-ios-1: 0 1px 2px hsl(0 0% 0% / 0.04)`
- `--shadow-ios-2: 0 4px 12px hsl(0 0% 0% / 0.06)`
- `--shadow-ios-nav: 0 -1px 0 hsl(0 0% 0% / 0.06)` (bottom bar)
Remover `glow-brand` de elementos não-hero; manter só no CTA principal.

---

### 3. Componentes estruturais a corrigir

| Arquivo | O que muda |
|---|---|
| `src/components/layout/MainLayout.tsx` | `pt-12` só quando existir botão hamburger; adicionar `pb-[calc(64px+env(safe-area-inset-bottom))]` no `<main>` mobile para não esconder conteúdo atrás da tab bar. |
| `src/components/layout/AppSidebar.tsx` | Desktop: espaçamento consistente 12/16, tipografia `ios-callout`, item ativo com fundo `bg-primary/10 text-primary` (não gradient forte) exceto marca. Mobile bottom nav: altura 56 + safe area, ícone 24 acima do label 11px, min touch 44×44, borda superior fina `shadow-ios-nav`, item ativo apenas com cor primária (sem pill pesada). Sheet "Mais" com grid limpo, `rounded-2xl`, títulos 17px. |
| `src/components/ui/button.tsx` | Todas as variantes → `rounded-xl`, altura mínima `h-11` (44px) para default, `h-9` só em variantes explícitas `sm`, texto `ios-callout`; foco visível `ring-2 ring-ring/40`; estado pressed `active:scale-[0.98]`. |
| `src/components/ui/input.tsx` / `select.tsx` / `textarea.tsx` | `h-11`, `rounded-xl`, `text-[15px]`, label sempre visível (não confiar em placeholder), foco `ring-2`. |
| `src/components/ui/card.tsx` | `rounded-2xl`, `shadow-ios-1`, borda `border-border/60`, padding 20. Header/Content padrão 20/16. |
| `src/components/ui/dialog.tsx` / `sheet.tsx` / `drawer.tsx` | Bordas `rounded-2xl` topo, respeito a safe-area top/bottom, botão fechar 44×44, `max-h-[92dvh]` com scroll interno controlado. Mobile: usar `Drawer` (bottom sheet) em vez de `Dialog` fullscreen quando fizer sentido nos formulários grandes. |
| `src/components/ui/table.tsx` | Mobile: wrapper transforma em lista de cards (`hidden md:table` + fallback stack de linhas com labels). |
| `src/components/ui/badge.tsx` | `rounded-full`, `px-2.5 py-0.5`, `ios-footnote`, ícone opcional antes do texto. |
| `src/components/ui/StatCard.tsx` | Padrão iOS: título 13px muted uppercase-off, valor 28px bold, delta 13px com ícone ▲/▼ + texto. Alturas iguais via `min-h-[112px]`. |

---

### 4. Telas — mudanças estruturais

**`src/pages/HomeProfissional.tsx` + `DashboardTab.tsx`**
- Remover grade semanal do mobile (render condicional `hidden md:block`).
- Novo header: título `ios-title1` "Início" + subtítulo data por extenso.
- Stack vertical de 4 seções compactas: KPIs (grid 2×2 mobile), "Próximos 3 atendimentos" (lista com CTA "Ver agenda"), alertas de estoque (compactos), atalhos.
- Remover emojis dos títulos ("👋", etc.).
- Cards de mesma altura, sem scroll interno.

**`src/components/agenda/AgendaGrid.tsx` + `AgendamentosTab.tsx`**
- Mobile default: **Lista Diária**. Grade semanal só em `md:` (tablet+).
- Faixa horizontal de datas (7-14 dias) com scroll-x snap, item ativo destacado; único elemento com scroll horizontal.
- Lista de atendimentos: cards ≥72px, layout: horário (esquerda, tabular-nums 17px semibold) | separador | cliente 17px semibold + serviço 13px muted + status pill 11px com ícone.
- Botões "Novo" e "Bloquear" no header do módulo com `h-11 min-w-11`, sem FAB flutuante sobre conteúdo.
- Semanal (tablet+): manter `AgendaGrid` atual, mas revisar padding, tipografia dos blocos (13px), remover scroll interno aninhado (single scroll container).
- Status: sempre texto + ícone lucide (`Check`, `Clock`, `AlertCircle`, `X`, `Play`), nunca só cor.

**`ClientesTab.tsx`**
- Search bar sticky no topo com `h-11`, ícone lupa, chips de filtro rolando horizontalmente logo abaixo.
- Cards de cliente 72px min, avatar (iniciais) 40px, nome 17px semibold, telefone/último atendimento 13px muted, chevron direita.
- Drawer de detalhes vira bottom sheet no mobile.

**`FinanceiroTab.tsx` + `FinanceiroPessoalPanel.tsx`**
- Segmented control iOS-like (Negócio/Pessoal) com `rounded-xl bg-secondary p-1`, itens `h-9`.
- KPIs 28px bold, delta 13px.
- Período: pill selector horizontal.
- Tabela → lista de cards no mobile.

**Estoque / Serviços / Fichas / Como Utilizar**
- Aplicar mesmo padrão: header título 28px, listas de cards 72px+, formulários em Drawer no mobile, botões primários `h-11`.

---

### 5. Responsividade — checkpoints

Validar em 320, 375, 390, 430, 768, 1024, 1440:
- Sem overflow-x (grep `overflow-x-auto` e revisar).
- BottomTabBar nunca cobre conteúdo (padding no `<main>`).
- Grade semanal apenas ≥768.
- Toque ≥44×44 em todos os botões (button.tsx garante default).
- Safe-area top/bottom em todos os overlays.
- Sem scroll interno aninhado nas telas principais.

---

### 6. Acessibilidade

- `aria-label` em todos ícones-only (bottom nav "Mais", FABs, close buttons).
- Foco visível padronizado via `focus-visible:ring-2 ring-ring/50 ring-offset-2`.
- Status agenda com ícone + texto (não só cor).
- `<main>` único por rota.
- Alt text nos avatares (iniciais como fallback textual).

---

### 7. Detalhes técnicos

- **Não** alterar: rotas, `AuthContext`, hooks `queries/index.ts`, edge functions, RLS, lógica de mutations, validação Zod, integrações Supabase.
- Todas mudanças concentradas em: `src/index.css`, `tailwind.config.ts` (só tokens novos), `src/components/ui/*`, `src/components/layout/*`, `src/components/modules/*`, `src/components/agenda/AgendaGrid.tsx`, `src/pages/HomeProfissional.tsx`.
- Buscar e remover: emojis em títulos/nav (`rg "[\p{Emoji}]" src/components src/pages`), `text-[9px]`, `text-[10px]`.
- Após edits: `tsgo` para checar TS, revisão visual via Playwright em 375/768/1024.

---

### 8. Entregáveis finais

Ao concluir, relatório com:
1. Lista de arquivos alterados.
2. Componentes estruturais corrigidos (button, input, card, sidebar, bottom nav, agenda grid, etc.).
3. Problemas visuais resolvidos (grade semanal no mobile, tipografia inconsistente, raios misturados, emojis).
4. Prints de validação nos 7 breakpoints.
5. Confirmação de cores preservadas (diff dos tokens HSL = 0).
6. Resultado do build TS.
7. Limitações conhecidas.
