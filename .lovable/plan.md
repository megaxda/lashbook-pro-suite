## O que vamos corrigir

### 1) Bug: marcar "Concluído" + forma de pagamento não persiste

**Sintoma confirmado**: ao salvar, o modal fecha mas o status volta para "pendente" na lista.

**Investigação que vou fazer (com logs temporários e leitura direta no banco)**:
- Logar o payload enviado em `updateAppt` (`AgendamentosTab.tsx` linha 289) e o retorno do `supabase.update(...).select()`.
- Confirmar via `SELECT` se o status realmente gravou no banco para o agendamento editado. Isso separa dois cenários:
  - **A)** O update está retornando 0 linhas afetadas (RLS de UPDATE faltando/quebrada, ou `id` errado). Correção: ajustar policy ou o filtro.
  - **B)** Grava no banco, mas o cache do React Query mostra dado antigo. Correção: trocar `invalidate` por `qc.setQueryData` otimista + `refetchQueries` (await) antes de fechar o modal; e/ou usar `.select().single()` para validar.
- Verificar se `pagamentos_detalhe` como array vazio não está disparando alguma validação. Vou enviar `null` quando vazio em vez de `[]`.
- Garantir que o modal só fecha **depois** do refetch concluído (hoje fecha antes), evitando flash com dado stale.

**Correções aplicadas independentemente do diagnóstico**:
- `updateAppt` passa a usar `.update(...).select("id, status, forma_pagamento").single()` e exibe erro real (`error.message`) em vez de toast genérico.
- Aguardar `await qc.refetchQueries({ queryKey: ["agendamentos", uid] })` antes de `setSelectedAppt(null)`.
- Normalizar `pagamentos_detalhe`: `cleanPag.length ? cleanPag : null`.
- Mesmo tratamento aplicado em `createAppt` e `saveBloqueio` para evitar o mesmo bug em outros fluxos.

### 2) Outros bugs que vou varrer no mesmo passe

Vou abrir os módulos críticos e checar padrões similares (modal fecha antes do refetch, `update` sem `.select()`, swallow de erros). Escopo:
- `AgendamentosTab` (criar, editar, excluir, bloqueio).
- `FinanceiroTab` (criar/editar/excluir transação — já trocamos o input, mas confirmar persistência).
- `ClientesTab`, `EstoqueTab`, `ServicosTab` (mesmo padrão de save).
- `FichasTab` (salvar ficha + baixa de estoque).

Para cada bug encontrado: descrevo em uma linha + aplico a correção mínima. Se aparecer algo grande fora do escopo, paro e te aviso antes de mexer.

### 3) Tour do app — redesign "cards bonitos"

Trocar o visual padrão do `react-joyride` por tooltip customizado (`tooltipComponent`), 100% em pt-BR, com a identidade FinBeauty:

- **Card**: fundo `bg-card`, borda azul `border-primary/20`, sombra forte, cantos `rounded-2xl`, largura 360px.
- **Header**: ícone grande em círculo `bg-primary/10 text-primary` (ex.: `Calendar`, `Users`, `DollarSign` por etapa) + título `text-xl font-bold`.
- **Ilustração mínima**: faixa decorativa no topo com gradiente `from-primary/15 to-primary/0` (sem imagens externas, mantém performance).
- **Corpo**: texto curto (2 linhas máx), `text-muted-foreground`.
- **Rodapé**: barra de progresso `1 de 9`, botão secundário "Pular tour", botão primário "Próximo" (último vira "Concluir"), link discreto "Não mostrar de novo".
- **Boas-vindas (passo 0)**: card central maior com ilustração SVG inline (ícone do app + sparkles), CTA "Começar tour" / "Agora não".
- **Textos revisados em pt-BR natural** (sem "Cadastre", "alimenta" etc. corporativo): linguagem direta e amigável, voltada para profissional de estética.
- **Mobile**: tooltip vira bottom sheet (largura 100%, cantos só no topo), e os passos com `target` de sidebar passam a apontar para o `data-tour` da nav inferior automaticamente.
- Mantém persistência atual (localStorage + `profiles.onboarding_completed`) e o botão "Refazer tour" em `AccountPage`.

### Arquivos previstos

- `src/components/onboarding/AppTour.tsx` — passa a usar `tooltipComponent` custom + textos reescritos.
- `src/components/onboarding/TourTooltip.tsx` (novo) — card estilizado.
- `src/components/modules/AgendamentosTab.tsx` — fix do save (validação + refetch await + erro real).
- Outros tabs — só se a varredura encontrar o mesmo padrão.

### Fora do escopo

- Não vou refazer o financeiro nem a agenda visualmente. Só correção de bugs encontrados.
- Não vou adicionar imagens externas no tour (mantém leve).
