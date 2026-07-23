
# Design System FinBeauty — Documento Consolidado

Criar um documento único e completo que permita replicar 100% da identidade visual e da interface do app em outro projeto, sem precisar abrir o código.

## Entregáveis

1. `docs/FinBeauty-Design-System.md` — documento mestre em Markdown
2. `docs/FinBeauty-Design-System.docx` — versão Word gerada via pandoc (para compartilhar com designers/stakeholders)

## Estrutura do documento

### 1. Fundamentos da marca
- Nome, versão, tagline
- Cor primária (#bd1a1b) + variações (glow, soft, muted)
- Logo (ícone DollarSign em gradiente vermelho) e regras de uso
- Tom de voz (pt-BR, direto, acolhedor)

### 2. Tokens de cor (HSL + HEX)
Tabela completa extraída de `src/index.css` com **todos** os tokens semânticos:
- Superfícies: `background`, `foreground`, `card`, `popover`, `muted`, `secondary`, `accent`, `border`, `input`, `ring`
- Marca: `primary`, `primary-foreground`, `brand-glow`, `brand-soft`, `brand-muted`
- Sidebar: 8 tokens (`sidebar-*`)
- Feedback: `success`, `warning`, `info`, `destructive` (+ foregrounds)
- Agenda/status: `block`, `status-confirmed`, `status-pending`, `status-inprogress`, `status-done`, `status-canceled`, `status-confirmar`
- Para cada token: nome CSS, HSL, HEX, uso recomendado, exemplo visual (bloco colorido inline)

### 3. Tipografia
- Fonte: **Plus Jakarta Sans** (Google Fonts, pesos 300–800)
- Escala tipográfica completa (classes `.t-*` de `index.css`):
  - `t-screen-title` (26/28px, bold)
  - `t-section-title` (20/22px, semibold)
  - `t-card-title` (17/18px, semibold)
  - `t-card-desc` (14/15px, muted)
  - `t-body`, `t-button`, `t-aux`, `t-meta`
- Regra: nunca abaixo de 12px, botões sempre 16px/600

### 4. Espaçamento, raio e sombras
- Border radius: `--radius: 0.75rem` + variantes lg/md/sm
- Escala de espaçamento Tailwind (referência 4px)
- Utilitários customizados: `pb-safe`, `scrollbar-thin`
- Sombras e efeitos: `glow-brand`, `gradient-brand`, `gradient-card`, `glass-card`, `text-gradient-brand`

### 5. Animações e movimento
Keyframes de `tailwind.config.ts`:
- `fade-in`, `slide-in`, `pulse-brand`, `accordion-down/up`
- Duração e curvas padrão

### 6. Componentes (baseados em shadcn/ui)
Catálogo de componentes usados com variantes e quando usar cada um:
- **Botões** (variants: default/primary, secondary, destructive, outline, ghost)
- **Inputs** (Input, Textarea, `CurrencyInputBRL`, ClientCombobox)
- **Cards, Sheets, Dialogs, Drawers**
- **Tabs, Badges, Toasts (sonner + toaster)**
- **Chips de filtro** (padrão de active/inactive)
- **Sidebar** (desktop colapsável + bottom nav mobile de 4 itens + "Mais")

### 7. Padrões de layout
- Grid app shell (sidebar + main com `pt-12 lg:pt-0`)
- Mobile-first, breakpoint principal `lg` (1024px)
- Bottom nav fixa com `env(safe-area-inset-bottom)`
- Padrão de tela: header + filtros + conteúdo + FAB/CTA

### 8. Padrões de UX
- Estados: loading (skeleton), empty state (ilustração + CTA), erro (alert vermelho)
- Validação de formulário (borda vermelha + `aria-invalid` + mensagem `role="alert"` + banner topo)
- Confirmações destrutivas via AlertDialog
- Feedback por toast (success verde, error vermelho)

### 9. Sistema de status (Agenda)
Tabela com cor, hex, quando usar, exemplo:
- Pendente (amarelo), Confirmado (azul), Em andamento (ciano), Concluído (verde), Cancelado (vermelho), A confirmar (rosa), Bloqueio (roxo listrado)

### 10. Iconografia
- Biblioteca: **lucide-react**
- Tamanhos padrão: 16, 18, 20, 24px
- Ícones-chave por módulo (Home, Users, Calendar, DollarSign, Package, Scissors, FileText)

### 11. Acessibilidade
- Contraste mínimo AA garantido nos tokens
- `aria-label`, `aria-invalid`, `role="alert"`
- Touch targets ≥ 44px em mobile

### 12. Anexos técnicos
- Bloco completo `:root` do `index.css` (copy-paste ready)
- Bloco completo `tailwind.config.ts` (theme.extend)
- Lista de dependências visuais (`package.json` relevantes: tailwind, shadcn, lucide, sonner, recharts, joyride)
- Instruções de replicação: passos para plugar o design system em um novo projeto Vite+React+Tailwind

## Observações
- Documento em português
- Blocos de código copiáveis para acelerar replicação
- Sem screenshots (mantém arquivo leve e versionável); referências textuais suficientes
