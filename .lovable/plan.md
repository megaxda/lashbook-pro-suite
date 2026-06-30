## Problema

No painel admin, "Estender prazo" e "Liberar para sempre" mostram toast de sucesso, mas o `access_expires_at` do usuário não muda. Causa raiz:

- `useAdminUsers.updateUser` executa `supabase.from('profiles').update(...).eq('id', id)` **sem `.select()`**.
- Se a RLS da tabela `profiles` não permite que um admin atualize o perfil de outro usuário, o Supabase retorna `error = null` e `0 linhas afetadas`. O hook trata como sucesso e mostra "Usuário atualizado", mas nada foi gravado.
- Erros reais (RLS, constraint) ficam mascarados pelo handler genérico `Erro ao atualizar`.

## Correção

### 1. Edge Function `admin-update-user` (service role, segura)
Criar (ou estender, se já existir `admin-create-user`) uma function que:
- Recebe `{ userId, updates }`.
- Valida que o caller é admin via `has_role(auth.uid(), 'admin')` (security definer).
- Faz o `UPDATE` em `public.profiles` com a service role, retornando a linha atualizada.
- Restringe os campos permitidos (`plano`, `status_conta`, `access_expires_at`, `nome`, `email`, `telefone`) para evitar escalonamento (não permitir alterar `role`/`id`).

### 2. `src/hooks/useAdminUsers.ts`
- Trocar o `update` direto pela invocação `supabase.functions.invoke('admin-update-user', { body: { userId, updates } })`.
- Retornar a linha atualizada; se vier vazia, lançar erro.
- `onError` passa a mostrar a mensagem real (`error.message`) no toast.

### 3. `src/pages/AdminPage.tsx`
- `handleExtendAccess` e `handleUnlockForever`: aguardar `mutateAsync` antes de fechar o diálogo / mostrar feedback, garantindo que a UI só confirma após a persistência real.
- Pequena melhoria visual: mostrar a nova data de expiração no toast de sucesso (ex.: "Acesso liberado até 30/07/2026" / "Acesso liberado para sempre").

### 4. Validação RLS (defensiva)
Verificar política de UPDATE de `public.profiles`. Caso falte um caminho para admin (`has_role(auth.uid(),'admin')`), a edge function com service role já contorna; nada de política nova exposta ao cliente.

## Validação
- Abrir painel admin → "Estender prazo" 30 dias em um usuário → recarregar → coluna "Acesso" mostra "Até [data]".
- "Liberar para sempre" → coluna mostra "Ilimitado".
- "Bloquear agora" → coluna mostra "Bloqueado".
- Forçar erro (usuário inexistente) → toast exibe mensagem real, não o genérico.

## Escopo
Apenas o fluxo de acesso no admin. Sem mudanças em agenda, financeiro, clientes ou auth do app.
