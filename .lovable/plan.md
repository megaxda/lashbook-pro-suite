## Plano de implementação

### 1. Criação manual de usuários no Painel Admin

Adicionar nova aba **"Criar Usuário"** em `src/pages/AdminPage.tsx`, ao lado de Analítica e Usuários.

- Formulário com: Nome, Email, Senha (com gerador automático), Telefone, Plano (básico/pro/enterprise), Função (usuário/admin)
- Botão "Criar conta"
- Edge Function nova `admin-create-user` (com `verify_jwt = true`) que:
  - Verifica se quem chama é admin (via `current_user_is_admin()`)
  - Usa `SUPABASE_SERVICE_ROLE_KEY` + `supabase.auth.admin.createUser()` para criar a conta já confirmada
  - Atualiza `profiles` com nome, telefone, plano e role
- Após criar, mostrar toast de sucesso e exibir as credenciais geradas em um dialog (com botão de copiar) para o admin compartilhar com o novo usuário
- Refresh automático da lista de usuários

### 2. Fluxo de agendamento via Link Bio

**Diagnóstico:** A função `create_public_booking` já está correta — ela localiza o profissional pelo `slug`, cria/reaproveita o cliente e insere o agendamento vinculado ao `user_id` do dono do link. Então o agendamento JÁ vai para a agenda do dono.

**Ajustes necessários em `src/pages/LinkBioPage.tsx`:**
- Após a chamada bem-sucedida de `create_public_booking`, substituir/garantir uma tela final clara de "Agendamento marcado com sucesso!" com:
  - Ícone de check verde grande
  - Resumo: profissional, serviço, data, horário
  - Mensagem: "Em breve você receberá uma confirmação. Aguarde o contato do profissional."
  - Botão "Fazer novo agendamento"
- Toast de sucesso `toast.success("Agendamento marcado com sucesso!")`
- Garantir que erros sejam tratados (toast de erro)

### 3. Bug visual do popup de WhatsApp Follow-up

**Problema (screenshot):** Os cards de templates de mensagem em `ClientesTab.tsx` estão com texto cortado/atravessando a borda direita do dialog, e o dialog parece estourar a viewport no mobile.

**Correções em `src/components/modules/ClientesTab.tsx` (dialog de templates WhatsApp):**
- Cada card de template:
  - Container com `w-full min-w-0 overflow-hidden`
  - Título em `truncate` ou `line-clamp-1`
  - Preview da mensagem em `line-clamp-2 break-words` (não usar `whitespace-nowrap`)
  - Padding consistente
- Dialog content já tem `w-[calc(100%-1rem)] max-w-lg` no `dialog.tsx` — confirmar que o conteúdo interno respeita `min-w-0`
- Textarea da mensagem personalizada com `resize-none` e largura `w-full`
- Botão "Enviar" full-width com tipografia `.t-button`

### Detalhes técnicos

**Arquivos a alterar:**
- `src/pages/AdminPage.tsx` — nova aba "Criar Usuário" + dialog de credenciais
- `src/components/modules/ClientesTab.tsx` — fix overflow do dialog WhatsApp
- `src/pages/LinkBioPage.tsx` — tela final de sucesso aprimorada

**Arquivos a criar:**
- `supabase/functions/admin-create-user/index.ts` — edge function para criação de usuário pelo admin
- `supabase/config.toml` — adicionar bloco `[functions.admin-create-user]` com `verify_jwt = true`

**Migrações:** Nenhuma necessária (a `create_public_booking` já está correta).

**Sem mudanças em:** lógica de banco existente, RLS, autenticação.
