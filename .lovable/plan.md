# Plano — Finanças Pessoais + Validação Novo Agendamento

## Parte 1 — Sub-aba "Finanças Pessoais" dentro do Financeiro

**Objetivo:** dar ao usuário um espaço para lançar receitas e despesas da vida pessoal (salário, mercado, aluguel, lazer) totalmente separadas do fluxo do negócio, sem poluir os relatórios do studio.

### 1.1 Banco de dados (nova tabela)

Nova tabela `public.financeiro_pessoal` — igual em estrutura à `financeiro`, mas sem `agendamento_id` / `profissional_id`, com categorias próprias.

Campos de negócio: `tipo` (`receita` | `despesa`), `descricao`, `valor`, `data`, `categoria`, `forma_pagamento` (opcional), `notas` (opcional).

RLS: usuário só vê/edita os próprios lançamentos (`user_id = auth.uid()`). GRANTs para `authenticated` e `service_role`.

### 1.2 Interface — toggle "Negócio | Pessoal"

Na tela `FinanceiroTab`, adicionar um segmented control no topo (logo abaixo do título) com dois modos:

- **Negócio** (padrão): comportamento atual, intacto. Todos os gráficos, KPIs, tabela unificada e exportação continuam idênticos.
- **Pessoal**: renderiza uma versão enxuta focada em controle pessoal.

O modo escolhido fica em `useState` + `localStorage` (`fin_mode`) para persistir entre sessões.

### 1.3 Modo Pessoal — o que aparece

Layout simples e distinto do modo negócio para deixar claro que é outro contexto:

- Seletor de período reutilizado (Hoje / 7 dias / Mês / Mês anterior / Personalizado).
- 3 KPIs: **Entradas**, **Saídas**, **Saldo** do período.
- Gráfico único: barras Entradas vs Saídas por dia.
- Despesas por categoria (mesma PieChart, categorias pessoais).
- Tabela de lançamentos com filtros (tipo, categoria, busca) e paginação 20/pág.
- Botões **+ Nova entrada** e **+ Nova saída** abrem modal simples (descrição, valor, data, categoria, forma pagamento, notas).
- Categorias pessoais padrão sugeridas no select: Salário, Investimentos, Outros (receita) · Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Compras, Outros (despesa). Usuário pode digitar categoria livre.
- Exportação CSV do modo pessoal separada (arquivo `financas-pessoais-YYYY-MM-DD.csv`).

### 1.4 Isolamento total

- Consultas do modo Negócio **nunca** leem `financeiro_pessoal`.
- Consultas do modo Pessoal **nunca** leem `financeiro`.
- Nada de lançamento pessoal aparece em Dashboard, comparativo 6 meses ou relatórios do negócio.

### 1.5 Modo Demo

Adicionar dados demo pessoais em `src/data/demoData.ts` (5–8 lançamentos) para o modo Pessoal funcionar quando o Modo Demo está ativo.

---

## Parte 2 — Bug #3: Validação visível no modal Novo Agendamento

**Sintoma:** ao clicar em Salvar sem cliente/serviço/data válidos, o modal continua aberto sem nenhuma mensagem de erro visível nem semântica acessível.

### O que corrigir em `AgendamentosTab.tsx` (modal de criação/edição de agendamento)

1. Antes do `mutate`, rodar validação com **zod** dos campos obrigatórios: `cliente_id`, `servico_id`, `data`, `horario`.
2. Guardar erros em `useState<Record<string,string>>({})` e limpar ao editar cada campo.
3. Para cada campo com erro:
   - Adicionar `aria-invalid="true"` no `Input`/`Select`/`ClientCombobox`.
   - Renderizar `<p role="alert" className="text-sm text-destructive mt-1">{msg}</p>` logo abaixo.
   - Aplicar borda vermelha (`border-destructive`) quando inválido.
4. Se houver ao menos 1 erro, exibir também um bloco no topo do modal: `<div role="alert" className="rounded-md bg-destructive/10 text-destructive p-3 text-sm">Corrija os campos destacados antes de salvar.</div>`.
5. Toast `toast.error("Preencha os campos obrigatórios")` mantido como reforço.
6. `ClientCombobox`: quando a busca não retorna cliente, mostrar mensagem visível "Nenhuma cliente encontrada — cadastre uma nova" dentro do popover (verificar se já existe; se não, adicionar).

### Nada mais é tocado

- Lógica de mutation, `updateAppt`, criação recorrente, edição de duração — tudo permanece.
- Fluxo de "Concluir" agendamento (bug já corrigido em turno anterior) intacto.

---

## Itens do relatório NÃO incluídos (justificativa)

Conforme sua resposta, são problemas de dados do ambiente de teste e não bugs reais do app — nenhuma mudança de código faria sentido:

- **#1** `Lash Fill` inexistente: o serviço simplesmente não estava cadastrado nesse tenant.
- **#2** Pedicure R$60 sem lançamento: o agendamento provavelmente não estava com status `concluido`; o trigger `auto_create_receita_on_concluido` só dispara na conclusão.
- **#4** Empty state Agendamentos: o tenant tinha 5 agendamentos, então a tela correta a mostrar é o grid, não o empty state (que já existe no código para lista realmente vazia).
- **#5** Empty state Clientes: idem — o tenant tinha 7 clientes.

---

## Detalhes técnicos (para referência)

**Migration SQL (resumo):**

```text
CREATE TABLE public.financeiro_pessoal (
  id uuid PK, user_id uuid FK auth.users,
  tipo text CHECK IN ('receita','despesa'),
  descricao text, valor numeric NOT NULL,
  data date NOT NULL, categoria text,
  forma_pagamento text, notas text,
  created_at, updated_at
);
GRANT SELECT,INSERT,UPDATE,DELETE ON financeiro_pessoal TO authenticated;
GRANT ALL ON financeiro_pessoal TO service_role;
ALTER TABLE ... ENABLE ROW LEVEL SECURITY;
CREATE POLICY user_own ON financeiro_pessoal FOR ALL
  USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
+ trigger update_updated_at.
```

**Arquivos afetados:**
- `supabase/migrations/*` (nova migration)
- `src/hooks/queries/index.ts` (novo hook `useFinanceiroPessoal` + queryKey)
- `src/lib/queryClient.ts` (chave `financeiroPessoal`)
- `src/components/modules/FinanceiroTab.tsx` (toggle + branch modo pessoal — pode extrair sub-componente `FinanceiroPessoalPanel.tsx` para manter arquivo legível)
- Novo `src/components/modules/FinanceiroPessoalPanel.tsx`
- `src/data/demoData.ts` (dados demo pessoais)
- `src/components/modules/AgendamentosTab.tsx` (validação zod + mensagens acessíveis)
- `src/integrations/supabase/types.ts` (regen automático após migration)
