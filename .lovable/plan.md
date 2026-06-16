## Esclarecimento importante sobre "esconder" o backend

O URL do projeto Cloud e a `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key) no `.env` **são públicos por design** — toda app web os envia para o navegador do usuário. Não é possível "escondê-los", e tentar ofuscar dá falsa segurança. O que realmente protege os dados é:

1. **RLS** correto em cada tabela (cada usuário só lê/escreve o que é dele).
2. **Edge functions** validando JWT + role no servidor.
3. **Service role key** nunca no frontend (já está só no servidor — verificado).
4. **Inputs validados** no cliente e no servidor.

Vamos focar nessas 4 frentes, mais a rotação preventiva de chaves.

---

## Parte 1 — Segurança

### 1.1 Auditoria + reforço de RLS
Auditar políticas de todas as 10 tabelas (`profiles`, `agendamentos`, `clientes`, `servicos`, `financeiro`, `estoque`, `fichas`, `bloqueios_agenda`, `follow_ups`, `push_subscriptions`):
- Confirmar que toda policy filtra por `user_id = auth.uid()`.
- Verificar `profiles`: leitura própria + leitura admin via `current_user_is_admin()`; bloquear alteração de `role` por usuário comum (trigger `prevent_role_change` já existe — confirmar).
- Confirmar `GRANT` apropriado em cada tabela (sem `anon` exceto onde a função pública precisa).
- Revogar `EXECUTE ... TO anon` de funções `SECURITY DEFINER` que **não** servem ao booking público (`is_admin`, `current_user_is_admin`, `check_slug_available`, `set_my_slug`, `auto_promote_known_admins`, `prevent_role_change`, `auto_create_receita_on_concluido`, `update_updated_at`, `handle_new_user`). Manter `anon` apenas em `get_public_profile_by_slug`, `get_public_services_by_slug`, `get_blocked_slots_by_slug`, `create_public_booking`.
- Resolver alertas do linter (SECURITY DEFINER expostos a anon/authenticated indevidamente).

### 1.2 Validação de inputs com Zod
Criar `src/lib/validation.ts` com schemas centralizados e aplicar em:
- **Auth** (`Auth.tsx`): email/senha/nome com limites.
- **LinkBioPage** (booking público): nome, telefone (BR), email opcional, notas (max 500), validação de arquivo de comprovante (tipo + tamanho).
- **ClientesTab**: nome, telefone, email, observações com limites de tamanho.
- **AgendamentosTab**: notas, valores numéricos.
- **FinanceiroTab**: descrição, valor (positivo, max 10M), categoria.

### 1.3 Hardening de edge functions
- `admin-create-user`: já valida role; adicionar **validação Zod do body** (email, senha mín 6, nome max 100, telefone formato).
- `send-push`: validar payload (title/body max length, url opcional URL válida, target em enum).
- `cleanup-comprovantes`: já é cron — adicionar checagem opcional de header `x-cron-secret` se quisermos restringir invocação manual (deixar opcional, sem secret novo).
- Garantir CORS + status codes consistentes + nunca logar tokens.

### 1.4 Rotação preventiva
- Rotacionar `LOVABLE_API_KEY` via tool (mantém integrações funcionando).
- **Não** rotacionar Supabase keys agora (não há evidência de vazamento; rotação invalida sessões e exige redeploy).
- Listar secrets para confirmar que nenhum segredo "fantasma" expirou.

### 1.5 Outras boas práticas
- Ativar **HIBP** (checagem de senhas vazadas) no auth via `configure_auth`.
- Confirmar que `disable_signup=false` e `auto_confirm_email` está como você quer (hoje: signup aberto, email auto-confirmado — mantém para o trial de 7 dias).

---

## Parte 2 — Sobreposições visuais

### 2.1 Agenda (`AgendaGrid.tsx`)
- Cards de agendamento com `overflow-hidden` + `min-h-[28px]` + truncate de texto longo.
- Coluna de horas com `width` fixa e `z-index` correto vs. coluna de dias.
- Blocos roxos: garantir que ficam acima do background mas abaixo de modais (z-20).
- Evitar acúmulo de borda dupla quando dois agendamentos colidem no mesmo slot (lado a lado com `flex` + `gap-1`).

### 2.2 Dashboard / Início
- Grid de KPIs: `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` com `gap-4`.
- Charts em containers com `aspect-video` ou `h-[280px]` fixos + `ResponsiveContainer 100%/100%`.
- "Próximos agendamentos" com `divide-y` e padding consistente.

### 2.3 Modais e drawers
- `DialogContent` com `max-h-[90vh] overflow-y-auto` em todos: ClienteDrawer, NovaFichaWizard, dialogs de agendamento e financeiro.
- Botão de fechar não cobre título (padding-right).
- Footer sticky em forms longos.

### 2.4 Bottom nav vs conteúdo (mobile)
- Adicionar `pb-20` (ou `pb-safe`) no container principal de `MainLayout` quando bottom nav estiver visível.
- FAB de "Novo agendamento" com `bottom-20` no mobile para não colidir com nav.
- Header fixo: `MainLayout` com `pt-14` no conteúdo.

---

## Arquivos a editar/criar

**Migrations:**
- `supabase/migrations/<timestamp>_security_hardening.sql` — REVOKE/GRANT em funções, confirmar policies.

**Validação:**
- Criar `src/lib/validation.ts`.
- Editar: `src/pages/Auth.tsx`, `src/pages/LinkBioPage.tsx`, `src/components/modules/ClientesTab.tsx`, `src/components/modules/AgendamentosTab.tsx`, `src/components/modules/FinanceiroTab.tsx`.

**Edge functions:**
- `supabase/functions/admin-create-user/index.ts`, `supabase/functions/send-push/index.ts`.

**UI/sobreposições:**
- `src/components/agenda/AgendaGrid.tsx`, `src/components/modules/DashboardTab.tsx`, `src/components/layout/MainLayout.tsx`, `src/components/modules/AgendamentosTab.tsx`, `src/components/modules/ClientesTab.tsx`, `src/components/fichas/NovaFichaWizard.tsx`, `src/index.css` (utilitários safe-area).

**Config:**
- Ativar HIBP via `configure_auth`.
- Rotacionar `LOVABLE_API_KEY` via tool.

---

## Fora de escopo
- Penetration test profissional / WAF / CAPTCHA (precisa serviço externo).
- 2FA (requer fluxo adicional de UI — peça separadamente se quiser).
- Mudança de provider de auth.
- Rebuild visual completo (só correção de sobreposições, não redesign).

Aprova para eu seguir?