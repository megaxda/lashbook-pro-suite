## Cadastro com trial de 7 dias + controle no admin

### Visão geral
Adicionar aba "Criar conta" na tela de login. Quem se cadastrar por ali ganha 7 dias de acesso. Após esse período, a conta é bloqueada e o usuário não consegue mais entrar no app — somente o admin pode liberar (estender por X dias ou liberar para sempre) pelo painel.

### Mudanças no banco
Adicionar à tabela `profiles`:
- `access_expires_at timestamptz NULL` — data limite de acesso. `NULL` = acesso ilimitado (admins, contas liberadas para sempre, ou contas criadas internamente via `/creatifin`).
- `signup_origin text DEFAULT 'internal'` — marca origem (`'public'` para cadastros pela tela de login, `'internal'` para os criados via `/creatifin`).

Atualizar a função `handle_new_user()` para ler `raw_user_meta_data->>'signup_origin'`:
- Se for `'public'` → grava `signup_origin = 'public'` e `access_expires_at = now() + interval '7 days'`.
- Caso contrário → mantém `access_expires_at = NULL` (acesso ilimitado, comportamento atual).

Política RLS continua a mesma — o bloqueio é feito na camada de app (mais simples, permite mostrar tela explicativa ao usuário).

### Tela de login (`src/pages/Auth.tsx`)
Adicionar tabs "Entrar" / "Criar conta". A aba de cadastro pede nome, email e senha e chama `signUp` passando `signup_origin: 'public'` no `data`. Mensagem de sucesso avisa: *"Conta criada! Você tem 7 dias de acesso gratuito."*

### Bloqueio de acesso
No `AuthContext`, após carregar o `profile`, calcular `isBlocked = profile.access_expires_at && new Date(profile.access_expires_at) < new Date()` (admins nunca são bloqueados). Expor `isBlocked` no contexto.

Criar componente `AccountBlocked` (tela cheia) com mensagem: *"Seu período de teste de 7 dias terminou. Entre em contato com o administrador para liberar o acesso."* + botão "Sair".

No `ProtectedRoute` (App.tsx), se `isBlocked` → renderiza `AccountBlocked` em vez do conteúdo. `AdminRoute` continua acessível para admins.

### Painel admin (`AdminPage.tsx` + `useAdminUsers.ts`)
Na lista de usuários, mostrar uma coluna/badge de status:
- "Ativo (ilimitado)" se `access_expires_at` é `NULL`
- "Trial — expira em DD/MM" se futuro
- "Bloqueado" se passado

Adicionar ações por usuário:
- **Estender prazo** → input de dias (ex: 7, 30, 90) → atualiza `access_expires_at = now() + dias`.
- **Liberar para sempre** → seta `access_expires_at = NULL`.
- **Bloquear agora** → seta `access_expires_at = now() - 1 minuto`.

### Detalhes técnicos
- Migration nova: 2 colunas em `profiles` + `CREATE OR REPLACE FUNCTION public.handle_new_user()` atualizada.
- `AuthContext` expõe `isBlocked: boolean`.
- Refresh do profile em ações do admin via `queryClient.invalidateQueries(['admin-users'])` (já existente).
- A função `is_admin`/`current_user_is_admin` existente continua sendo usada para distinguir admins (eles sempre têm `access_expires_at = NULL` por padrão e além disso ignoramos bloqueio se `role = 'admin'`).

### Arquivos
- **Migration**: nova SQL com `ALTER TABLE profiles` + `handle_new_user` atualizada.
- **Editar**: `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`, `src/App.tsx`, `src/pages/AdminPage.tsx`, `src/hooks/useAdminUsers.ts`.
- **Criar**: `src/components/AccountBlocked.tsx`.
