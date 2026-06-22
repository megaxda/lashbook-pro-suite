## Plano: Múltiplos profissionais, recorrência, correções de agenda e financeiro

### 1. Múltiplos profissionais
- **Banco**: nova tabela `profissionais` (id, user_id dono do estúdio, nome, cor, ativo, created_at). RLS por `user_id = auth.uid()`. GRANTs padrão para `authenticated` e `service_role`.
- Adicionar coluna `profissional_id uuid` (nullable, FK → `profissionais.id`) em `agendamentos` e em `financeiro`.
- **UI – Configurações/Perfil**: nova seção "Equipe" para cadastrar/editar/desativar profissionais com cor.
- **Modal Criar/Editar Atendimento** (`AgendamentosTab.tsx`): dropdown obrigatório "Profissional" carregando lista ativa. Se só houver 1, pré-seleciona.
- **Filtro na agenda**: chips/seletor no topo ("Todas" + uma por profissional). Estado persistido em localStorage. Aplica filtro nas 3 views (diária/semanal/mensal).

### 2. Recorrência + novo status
- **Banco**: adicionar a `agendamentos`:
  - `recorrencia_id uuid` (agrupa a série)
  - `recorrencia_intervalo_dias int` (ex: 21)
  - `recorrencia_fim date` (opcional)
- Ao criar agendamento com recorrência marcada, inserir N ocorrências futuras (até 6 meses ou até `recorrencia_fim`) compartilhando `recorrencia_id`. Cada ocorrência mantém seu próprio `servico_id` e pode ser editada individualmente (trocar de "Extensão" para "1ª manutenção" etc.) sem afetar as demais.
- Ao editar/cancelar: perguntar "somente este" ou "este e os futuros" (padrão: somente este).
- **Novo status `procedimento_a_confirmar`** no enum/constantes de status.
- **Cor rosa** (`hsl` no design system, token novo `--status-confirmar`) seguindo o padrão visual dos demais (confirmado, pendente, concluído, cancelado, bloqueio). Atualizar a legenda da agenda.

### 3. Correções visuais da agenda (`AgendaGrid.tsx`)
- **Diária/Semanal**: substituir a barra lateral fina por bloco sólido preenchido com a cor do status (com leve transparência), borda esquerda mais forte, texto sobre o bloco. Altura = duração real do procedimento (linha de início até linha de fim), respeitando o slot de minutos do grid.
- **Mensal**: refatorar o layout do mês para usar grid 7 colunas com `min-h` por célula e `overflow-hidden` nos cards internos; cards com `truncate`, máximo 3 visíveis + "+N mais" que abre popover do dia. Sem vazamento entre células.

### 4. Financeiro
- **Listagem/relatórios** (`FinanceiroTab.tsx`): exibir coluna "Cliente" ao lado de "Descrição". Buscar `cliente_id`/`profissional_id` via join (`agendamentos` → `clientes`/`profissionais`).
- **Exportação CSV/Excel**: gerar colunas separadas:
  `Data | Tipo | Serviço/Procedimento | Cliente | Profissional | Valor`
  em vez de concatenar tudo em "Descrição". Manter compatibilidade com receitas manuais (sem agendamento) preenchendo campos vazios.

### Detalhes técnicos
- Migrations Supabase (uma só): cria `profissionais`, adiciona colunas em `agendamentos`/`financeiro`, atualiza trigger `auto_create_receita_on_concluido` para propagar `profissional_id` para `financeiro`.
- Atualizar `create_public_booking` para aceitar `profissional_id` opcional (link da bio pode escolher profissional se houver mais de uma).
- Token de cor rosa em `index.css` + classe utilitária para a legenda.
- Sem mudanças em auth/permissões existentes.
