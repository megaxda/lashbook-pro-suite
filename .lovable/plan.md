## Objetivo
Permitir ajustar a duração de um agendamento específico (ex.: atendimento durou menos que o padrão do serviço), sem alterar o cadastro do serviço.

## Mudanças

### 1. Banco (migration)
- Adicionar coluna `duracao_min INTEGER NULL` em `public.agendamentos`.
- Quando preenchida, sobrepõe a duração padrão do serviço apenas naquele agendamento.
- Sem alterações em RLS/policies (a policy existente já cobre updates do dono).

### 2. Edição no modal (`AgendamentosTab.tsx`)
- No formulário de editar agendamento, adicionar campo "Duração (min)" com:
  - Placeholder mostrando a duração padrão do serviço selecionado.
  - Botão "Usar padrão do serviço" que limpa o override (volta a `null`).
  - Validação: inteiro entre 5 e 480.
- Persistir `duracao_min` no update do agendamento.
- Invalidar cache de agendamentos após salvar (padrão já usado).

### 3. Exibição na agenda (`AgendaGrid.tsx`)
- Onde hoje calcula `a.servicos?.duracao || 60`, passar a usar `a.duracao_min ?? a.servicos?.duracao ?? 60`.
- Aplicar em: cálculo de `endStr` no `ApptCard`, `computeHourRange`, posicionamento/altura no `WeeklyGrid` (top/height) e detecção de colisão.
- Atualizar a interface `AgendaAppt` para incluir `duracao_min?: number | null`.

### 4. Queries
- Em `src/hooks/queries/index.ts` (ou onde os agendamentos são buscados), incluir `duracao_min` no `select`.

### 5. Financeiro
- Sem mudanças. O trigger de receita usa `servicos.preco` / pagamentos detalhados — duração não impacta valor.

## Critérios de aceitação
- Editar um agendamento e definir duração = 30 min reduz o bloco visual na agenda imediatamente após salvar.
- Botão "Usar padrão do serviço" restaura o comportamento original (bloco volta ao tamanho do serviço).
- Mudar o serviço no cadastro não afeta agendamentos com `duracao_min` definido.
- Cards continuam mostrando o horário fim correto (`HH:mm–HH:mm`).
