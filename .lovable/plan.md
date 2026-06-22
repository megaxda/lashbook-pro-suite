# Carregamentos instantâneos com cache inteligente

## Diagnóstico atual

Cada aba (Dashboard, Agendamentos, Clientes, Estoque, Fichas, Financeiro, Serviços) usa `useState` + `useEffect` e chama `supabase.from(...)` na montagem. Ao trocar de tela, tudo é refeito do zero — mesmo dado que já estava carregado segundos atrás. O React Query está instalado e provisionado em `App.tsx`, mas só `useAdminUsers` o utiliza. O Dashboard sozinho dispara 9 queries por entrada.

**Sintomas:** "piscadas" de loading ao alternar abas, agenda recarrega ao voltar do cliente, financeiro refaz somatórios já calculados, e tudo conversa direto com o banco a cada navegação.

## Estratégia escolhida: React Query (cache em memória) + invalidação dirigida

Por que cache de cliente (React Query) e **não** cache local persistente (IndexedDB/localStorage):
- Dados são por-usuário, mutáveis e sensíveis (financeiro, clientes) — persistir entre sessões adiciona risco e complexidade de sincronização.
- React Query já está no projeto; resolve 90% do problema com staleTime + invalidação.
- Mantém uma única fonte de verdade: o banco. Sem divergência entre cache antigo e dados novos.

Realtime do Supabase **não** será habilitado em todas as tabelas (custo + risco de loop de reconexão). Usamos invalidação manual após mutações — barato e determinístico.

## Plano de implementação

### 1. Configurar o `QueryClient` global (`src/App.tsx`)
Trocar `new QueryClient()` por defaults conscientes:
- `staleTime: 60_000` (1 min) — durante esse tempo, navegar entre abas não refaz fetch.
- `gcTime: 5 * 60_000` (5 min) — dados ficam em memória mesmo se o componente desmontar.
- `refetchOnWindowFocus: false` — evita refetch ao alternar aba do navegador.
- `refetchOnMount: false` quando há dado fresco.
- `retry: 1`.

### 2. Criar hooks de dados em `src/hooks/queries/`
Um hook por recurso, com chave estável `["recurso", userId, filtros]`:
- `useAgendamentos(range)` — usado por Dashboard e Agendamentos (mesma key → 1 fetch só).
- `useClientes()` — Dashboard, Clientes, modal "novo agendamento".
- `useServicos()` — Dashboard, Agendamentos, Serviços, Link da Bio.
- `useEstoque()` — Dashboard, Estoque.
- `useFinanceiro(periodo)` — Dashboard, Financeiro.
- `useBloqueios(range)` — Dashboard, Agendamentos.
- `useProfissionais()` — múltiplas telas.
- `useFichas()` — Fichas.

Cada hook devolve `{ data, isLoading, error }` e respeita `enabled: !!user`.

### 3. Hook utilitário `useInvalidate`
Centraliza `queryClient.invalidateQueries({ queryKey: [...] })` para chamar após criar/editar/excluir. Mutações usam `useMutation` com `onSuccess` invalidando apenas as keys afetadas (ex.: criar agendamento → invalida `agendamentos` e `financeiro`, nada mais).

### 4. Substituir fetches nos componentes
Trocar `useState + useEffect + supabase.from` pelos novos hooks em:
- `DashboardTab.tsx` (9 queries → composição de hooks compartilhados, a maioria já em cache).
- `AgendamentosTab.tsx`, `ClientesTab.tsx`, `EstoqueTab.tsx`, `FichasTab.tsx`, `FinanceiroTab.tsx`, `ServicosTab.tsx`.
- Modais e wizards que listam clientes/serviços (`NovaFichaWizard`, criação rápida no Dashboard).

### 5. Prefetch ao logar
No `AuthContext`, após `user` confirmado, chamar `queryClient.prefetchQuery` para `clientes`, `servicos`, `profissionais` e agendamentos da semana corrente. Quando o usuário entra na primeira aba, dados já estão prontos — sensação de instantâneo.

### 6. Seleção fina de colunas
Auditar `.select("*")` (aparece em `bloqueios_agenda` no Dashboard, e em outras tabs) e restringir às colunas usadas. Reduz payload e tempo de parse.

### 7. Evitar refetch desnecessário em listas grandes
Para Financeiro/Agendamentos com paginação por período, a chave inclui o range — mudar de mês cria nova entrada de cache; voltar ao mês anterior usa o cache existente sem ir ao banco.

## Trade-offs e limites

- Dados podem ficar "velhos" por até 1 min entre abas — aceitável para este app (não é trading). Mutações invalidam na hora, então quem editou vê fresco imediatamente.
- Sem persistência entre reloads do navegador (F5 refaz fetch). Se quiser persistência depois, adicionamos `@tanstack/query-sync-storage-persister` em iteração futura.
- Realtime fica fora deste escopo; pode ser ligado pontualmente (ex.: agenda compartilhada por equipe) em outro passo.

## Resultado esperado

- Trocar de aba após o primeiro carregamento: 0 requisições, render imediato.
- Dashboard deixa de ser o gargalo: clientes/serviços/agendamentos vêm do cache compartilhado.
- Mutações continuam consistentes via invalidação dirigida.
- Carga no banco cai significativamente em sessões longas.
