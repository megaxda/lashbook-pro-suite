ns# Redesign clean — Financeiro, Dashboard, Clientes, Agenda

Objetivo: reduzir poluição visual, economizar espaço e elevar a hierarquia — mantendo 100% das funcionalidades atuais.

## Abordagem

Vou seguir um ritual de redesign em 2 atos por módulo, começando pelo **Financeiro** (tela em que você está agora) e replicando o padrão vencedor nos demais.

### Ato 1 — Fixar o gosto (1 rodada de perguntas)
Antes de gerar direções, confirmo 2 escolhas visuais rápidas com previews reais:
- **Tipografia**: par de fontes (mantendo Plus Jakarta ou trocando por algo mais editorial/clean).
- **Layout base**: densidade dos cards/KPIs (compacto tipo Linear, arejado tipo Notion, ou bento tipo Apple).

A paleta fica travada na marca (#bd1a1b + neutros) — sem retrabalho de brand.

### Ato 2 — 3 direções renderizadas
Capturo screenshot da tela atual do Financeiro e gero 3 protótipos HTML lado a lado, cada um com uma personalidade distinta (ex: "planilha executiva", "painel bancário", "relatório editorial"). Você escolhe 1 e eu implemento.

## Ordem de execução

1. **Financeiro** (tela atual — mais densa, prioridade) → pin taste → 3 direções → implementar
2. **Dashboard/Início** → aplicar tokens vencedores + 3 direções específicas de cards de resumo
3. **Clientes** → aplicar padrão + 3 direções para lista + drawer
4. **Agenda** → aplicar padrão + 3 direções para grid semanal/diário

Cada módulo vira uma rodada curta: 1 pergunta de escolha + 3 previews + implementação.

## Princípios de limpeza (aplicados em todos)

- Remover bordas/sombras redundantes; usar 1 nível de elevação por contexto.
- Consolidar chips de filtro em barra única com "Mais filtros" para secundários.
- KPIs: reduzir de 6 para 3 primários + 3 em linha secundária colapsável.
- Tabelas: zebra sutil, sem bordas verticais, tipografia tabular.
- Espaçamento: escala 4/8/16/24 (elimina valores intermediários).
- Ícones: apenas onde agregam significado (não decorativos).
- Cor: só para status e ações primárias; cinzas para o resto.

## Escopo técnico (só frontend)

- Editar `src/index.css` (tokens de espaçamento/tipografia/sombras).
- Editar componentes de `src/components/modules/` (Financeiro, Dashboard, Clientes, Agendamentos).
- Editar `src/components/agenda/AgendaGrid.tsx`.
- Nenhuma mudança em banco, RLS, edge functions ou lógica de negócio.

## Próximo passo se aprovado

Capturo o Financeiro atual e disparo a rodada 1 (pin taste + 3 direções). Confirma?
