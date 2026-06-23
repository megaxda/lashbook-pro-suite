## Diagnóstico do bug financeiro

O input `Valor (R$)` em `FinanceiroTab.tsx` (Nova Transação e Edição) é `type="number"`, que interpreta o ponto como separador decimal. Quando você digitou **11.237** pensando "onze mil duzentos e trinta e sete", o navegador entendeu **11,237** (onze inteiros, 237 milésimos). Por isso:

- Receita salva: `11.237` → exibe `R$ 11,237`
- Despesa salva: `2.567` → exibe `R$ 2,567`
- Lucro: `11.237 − 2.567 = 8.67` → `R$ 8,67`
- Ticket médio com `toFixed(0)` → `R$ 11`

Tudo bate com o print. Não é o `toLocaleString` que está errado — é a **entrada** que precisa virar uma máscara de moeda BRL.

## O que será feito

### 1. Máscara de moeda BRL nos inputs de valor

- Criar componente `CurrencyInputBRL` (`src/components/ui/currency-input.tsx`) que:
  - Aceita digitação livre de dígitos e formata em tempo real como `1.234,56`.
  - Trata o valor internamente como número (centavos → reais), sem perder precisão.
  - Mostra prefixo `R$` opcional.
  - `inputMode="decimal"` para teclado numérico no mobile.
- Substituir os dois inputs `Valor (R$)` em `FinanceiroTab.tsx` (criar e editar transação) por esse componente.
- Garantir formatação pt-BR consistente em todos os KPIs (já estão com `toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })`); ajustar o "Ticket médio" para usar o mesmo formato (hoje usa `toFixed(0)`).
- Ajustar a exportação CSV e a tabela para o mesmo padrão `R$ 1.234,56`.

### 2. Tour guiado no primeiro acesso

- Adicionar `react-joyride` como dependência.
- Criar `src/components/onboarding/AppTour.tsx` com etapas em pt-BR cobrindo: Início (KPIs do dia), Agendamentos, Clientes, Financeiro, Estoque, Serviços, Link da Bio e botão de criar.
- Disparar automaticamente após o login na primeira visita ao `/ln`, controlado por:
  - `localStorage["finbeauty.tour.completed"]` (rápido, por dispositivo).
  - Coluna `onboarding_completed boolean` em `profiles` (persiste entre dispositivos) via migration com GRANT já existente.
- Botões no tour: **Próximo**, **Pular**, **Não mostrar novamente** (marca ambos os flags).
- Item no menu da conta (`AccountPage`): **Refazer tour do app** — limpa os flags e reabre o tour.

### Detalhes técnicos

- O componente de moeda armazena `number | null` e expõe `onValueChange(value: number)`. Internamente usa string formatada `Intl.NumberFormat("pt-BR", { minimumFractionDigits: 2 })`.
- Migration:
  ```sql
  ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed boolean NOT NULL DEFAULT false;
  ```
  (GRANTs já existem na tabela; sem alteração de RLS.)
- `react-joyride` é client-side puro, sem impacto no SSR/preview.

### Fora do escopo

- Não vou mexer em outros formulários monetários (Serviços, Estoque) nesta tarefa para manter o foco; se quiser, faço numa próxima rodada.
