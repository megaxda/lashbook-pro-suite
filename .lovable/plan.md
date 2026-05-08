## Módulo de Push Notifications no Painel Admin

### Estado atual
- Tabela `push_subscriptions` já existe (endpoint, p256dh, auth, user_id)
- `public/sw.js` já trata `push` e `notificationclick`
- **Falta:** registro da subscription no cliente, chaves VAPID, edge function de envio e UI admin

### O que será construído

**1. Chaves VAPID (secrets)**
Gerar par de chaves VAPID e salvar como secrets de runtime:
- `VAPID_PUBLIC_KEY` (também exposta ao cliente)
- `VAPID_PRIVATE_KEY`
- `VAPID_SUBJECT` (mailto)

Adicionar `VAPID_PUBLIC_KEY` também como variável pública (ou retornar via edge function `get-vapid-public-key`) para o cliente usar no subscribe.

**2. Registro da subscription (lado cliente)**
Novo hook `src/hooks/usePushSubscription.ts`:
- Registra `/sw.js`
- Pede permissão de notificação
- Cria `PushSubscription` com a public key
- Salva/upserta em `push_subscriptions` (user_id = usuário logado)

Disparar automaticamente após login (no `AuthContext` ou `MainLayout`) com checagem de suporte (`'serviceWorker' in navigator && 'PushManager' in window`).

Botão "Ativar notificações" em `AccountPage` para usuários que negaram inicialmente.

**3. Edge Function `send-push` (verify_jwt = true, admin-only)**
- Valida JWT, confirma `current_user_is_admin()`
- Body: `{ title, body, url?, target: 'all' | { user_id } }`
- Carrega subscriptions da tabela conforme target
- Usa `web-push` (via npm em Deno) com chaves VAPID para enviar
- Remove subscriptions inválidas (410/404)
- Retorna `{ sent, failed }`

**4. UI Admin — nova aba "Notificações" em `AdminPage.tsx`**
Formulário:
- Título (obrigatório)
- Mensagem (obrigatório, textarea)
- URL de destino (opcional, default `/`)
- Destinatário: radio "Todos os usuários" / "Usuário específico"
  - Se específico: combobox listando usuários (`profiles` já carregado em useAdminUsers)
- Botão "Enviar notificação" → invoca `send-push`
- Toast com resultado (X enviadas, Y falhas)
- Histórico simples opcional (últimos envios em memória da sessão)

### Detalhes técnicos
**Arquivos a criar:**
- `supabase/functions/send-push/index.ts`
- `src/hooks/usePushSubscription.ts`
- `supabase/config.toml` — bloco `[functions.send-push]` com `verify_jwt = true`

**Arquivos a editar:**
- `src/pages/AdminPage.tsx` — nova aba "Notificações"
- `src/contexts/AuthContext.tsx` ou `src/components/layout/MainLayout.tsx` — disparar registro da subscription após login
- `src/pages/AccountPage.tsx` — toggle "Receber notificações push"

**Migrações:** nenhuma (tabela `push_subscriptions` já existe com RLS por user_id).

**Secrets necessários (vou pedir após sua aprovação):** `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. Posso gerar o par VAPID para você e instruir como colar.

### Resposta direta à pergunta
Sim — o admin poderá escolher entre **enviar para todos** ou **selecionar um usuário específico**. Ambos funcionarão.
