# Plano: Admin + Tipografia padronizada + Fix popup WhatsApp

## 1. Promover `nathancarvalhon@gmail.com` a administrador

Migration SQL que atualiza `profiles.role = 'admin'` para o usuário cujo email bate em `auth.users`.

```sql
UPDATE public.profiles
SET role = 'admin'
WHERE id = (SELECT id FROM auth.users WHERE email = 'nathancarvalhon@gmail.com');
```

Se o usuário ainda não existir (não fez signup), a migration não falha — apenas não atualiza nada. Nesse caso o usuário precisa criar conta primeiro em `/auth` e depois rodamos novamente. Vou checar antes de aplicar.

## 2. Corrigir popup do WhatsApp (e padrão geral de Dialog)

**Problema na imagem:** os botões pré-configurados ("Confirmação de agendamento", "Lembrete de retorno", "Reativação de cliente") têm o texto da mensagem (segunda linha) estourando para fora do card branco.

**Causa:** em `src/components/modules/ClientesTab.tsx` (linha 311), o `DialogContent` usa `max-w-[calc(100vw-2rem)] sm:max-w-sm`, mas o `<div className="min-w-0">` dentro do `Button` está dentro de um `Button` que por padrão tem `display: inline-flex` sem `w-full` no filho — o `min-w-0` não propaga e o `<p>` com `break-words` ainda assim respeita a largura natural do texto porque o pai não tem largura limitada.

**Correção em `ClientesTab.tsx` (popup WhatsApp, linhas 309–330):**
- Trocar a classe do botão para incluir `w-full` no wrapper interno: `<div className="min-w-0 w-full">`.
- Adicionar `whitespace-normal` no botão (shadcn `Button` tem `whitespace-nowrap` por padrão, que é o real culpado do overflow).
- Garantir `overflow-hidden` no `DialogContent`.

```tsx
<Button ... className="w-full justify-start text-left h-auto py-2.5 border-border text-foreground whitespace-normal">
  <div className="min-w-0 w-full">
    <p className="text-sm font-semibold break-words">{m.label}</p>
    <p className="text-xs text-muted-foreground mt-0.5 break-words">{...}</p>
  </div>
</Button>
```

**Varredura geral:** rodar busca por outros usos de `Button` com conteúdo multilinha e aplicar `whitespace-normal` onde houver mensagem/descrição. Locais conhecidos a revisar: `ClientesTab`, `AgendamentosTab`, `FichasTab`, `LinkBioPage`.

## 3. Padronização de tipografia mobile (diretriz fornecida)

Criar tokens utilitários em `src/index.css` dentro de `@layer components` para uso consistente em toda a UI:

```css
@layer components {
  .t-screen-title { @apply text-[26px] sm:text-[28px] font-bold leading-tight; }
  .t-card-title   { @apply text-[17px] sm:text-[18px] font-semibold; }
  .t-card-desc    { @apply text-[14px] sm:text-[15px] text-muted-foreground; }
  .t-body         { @apply text-base; }                /* 16px */
  .t-button       { @apply text-base font-semibold; }  /* 16px / 600 */
  .t-aux          { @apply text-[13px] sm:text-sm text-muted-foreground; } /* 13–14px */
  .t-meta         { @apply text-xs; }                  /* 12px mínimo */
}
```

E proibir uso de `text-[10px]` e `text-[11px]` no app — substituir pelas classes acima. Vou rodar `rg "text-\[10px\]|text-\[11px\]"` e trocar todas as ocorrências por `text-xs` (12px) ou `t-meta`.

**Aplicação inicial:**
- Títulos das telas (h1 dos Tabs): `t-screen-title`.
- Títulos de cards e tabelas: `t-card-title`.
- Descrições/subtítulos: `t-card-desc`.
- Botões principais: `t-button`.
- Labels auxiliares (datas, status, contadores): `t-aux` ou `t-meta`.

Não vou reescrever 100% dos componentes nesta passada — vou aplicar nos módulos mais visíveis (Dashboard, Clientes, Agendamentos, Financeiro, Fichas, Estoque, Serviços, Account, LinkBio) e deixar o utilitário disponível para o resto.

## 4. Pequenos ajustes de Dialog que ficaram pendentes

- Adicionar `overflow-hidden` no `DialogContent` base (`src/components/ui/dialog.tsx`) para evitar conteúdo "vazando" lateralmente em qualquer modal.
- Confirmar que `Button` com texto longo respeita `whitespace-normal` quando passado.

## Arquivos afetados

```text
NEW   supabase/migrations/<timestamp>_promote_admin_nathan.sql
EDIT  src/index.css                         (tokens de tipografia)
EDIT  src/components/modules/ClientesTab.tsx (fix popup WhatsApp + tipografia)
EDIT  src/components/modules/AgendamentosTab.tsx (tipografia)
EDIT  src/components/modules/DashboardTab.tsx    (tipografia)
EDIT  src/components/modules/FinanceiroTab.tsx   (tipografia)
EDIT  src/components/modules/EstoqueTab.tsx      (tipografia)
EDIT  src/components/modules/ServicosTab.tsx     (tipografia)
EDIT  src/components/modules/FichasTab.tsx       (tipografia)
EDIT  src/pages/AccountPage.tsx                  (tipografia)
EDIT  src/pages/LinkBioPage.tsx                  (tipografia)
```

## Fora do escopo

- Não vou trocar a fonte global (continua Plus Jakarta Sans).
- Não vou redesenhar componentes; só ajustar tamanhos/pesos conforme a diretriz.
- Não vou mexer em RLS nem em outras features de admin além de promover o usuário.

Posso aplicar?
