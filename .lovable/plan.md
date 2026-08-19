# Entrar como usuário (impersonação) no painel admin

Senhas não podem ser exibidas: o backend guarda apenas um hash irreversível (bcrypt), então não existe forma técnica de mostrar a senha original. A alternativa equivalente para auditoria é o admin entrar na conta do usuário.

## O que será construído

- Novo item **"Entrar como este usuário"** no menu de ações de cada usuário do painel admin.
- Ao clicar, abre um diálogo de confirmação explicando que a sessão de admin atual será substituída pela sessão do usuário auditado.
- Confirmando, o app abre uma nova aba já autenticada como aquele usuário (agenda, clientes, financeiro — exatamente o que ele vê).
- Um aviso fixo no topo do app enquanto estiver impersonando: "Você está visualizando como <nome do usuário>" com botão **Sair da auditoria**, que encerra a sessão e devolve o admin para a tela de login.

## Detalhes técnicos

1. **Edge function `admin-impersonate`**
   - Valida o `Authorization` do requisitante com `auth.getUser(token)` e confere `profiles.role = 'admin'` usando a service role (mesmo padrão de `admin-export-user`).
   - Recebe `{ userId: uuid }` validado com Zod.
   - Busca o e-mail do usuário e chama `admin.generateLink({ type: 'magiclink', email })`.
   - Retorna a `action_link` (uso único, expiração curta). Nunca retorna hash de senha nem a service role.
   - Bloqueia impersonar outro admin e impersonar a si mesmo.

2. **Registro de auditoria**
   - Nova tabela `admin_audit_log` (`id`, `admin_id`, `target_user_id`, `action`, `created_at`) com RLS: leitura só para admins (`current_user_is_admin()`), escrita apenas pela service role, mais os GRANTs correspondentes.
   - A edge function grava uma linha `impersonate` a cada uso.

3. **Frontend**
   - `src/hooks/useAdminUsers.ts`: nova mutation `impersonateUser` chamando a função.
   - `src/pages/AdminPage.tsx`: item de menu + diálogo de confirmação; ao receber o link, grava um marcador (`finbeauty_impersonating`) com nome/e-mail do alvo e abre o link em nova aba.
   - Novo componente `src/components/admin/ImpersonationBanner.tsx` renderizado no layout principal quando o marcador existe; "Sair da auditoria" limpa o marcador, faz `signOut()` e redireciona para `/auth`.

## Limitação conhecida

O navegador mantém uma sessão por origem: ao entrar como o usuário, a sessão de admin daquele navegador é substituída. Ao sair da auditoria será necessário fazer login de admin novamente (ou usar uma janela anônima para a auditoria).
