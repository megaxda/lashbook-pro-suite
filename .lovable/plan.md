# Correções de responsividade + Link Bio funcional

## Problema 1 — Overflow em diálogos, popups e inputs

Hoje todos os `DialogContent` do app usam o padrão da shadcn que define `max-w-lg` fixo, sem `max-h`, sem scroll, sem padding mobile. Em telas estreitas o conteúdo "atravessa" a caixa porque:

- `Input` não tem `min-w-0`, então dentro de flex/grid empurra o pai.
- `DialogContent` não tem `max-h-[90vh] overflow-y-auto`, conteúdo longo (wizard de ficha, agendamento, financeiro) corta ou estoura.
- Labels longas (nome de cliente, descrição de serviço) sem `truncate`/`break-words` quebram layout.
- No mobile o dialog ocupa `max-w-lg` mas com `p-6` sobra pouco espaço para o conteúdo.

### O que será feito

1. **`src/components/ui/dialog.tsx`** — atualizar `DialogContent` para:
   - `w-[calc(100%-1rem)] max-w-lg` (margem segura no mobile)
   - `max-h-[90vh] overflow-y-auto`
   - `p-4 sm:p-6`
   - `gap-3 sm:gap-4`

2. **`src/components/ui/input.tsx`** — adicionar `min-w-0` na classe base para nunca empurrar containers flex.

3. **Modais existentes** (Clientes, Agendamentos, Financeiro, Estoque, Serviços, Fichas, Dashboard):
   - Envolver formulários com `space-y-3` consistente.
   - Trocar `grid grid-cols-2` em telas pequenas por `grid grid-cols-1 sm:grid-cols-2`.
   - Adicionar `truncate` / `break-words` em títulos e descrições renderizadas.
   - Garantir que cada `<Input>`/`<Select>` esteja dentro de um wrapper `min-w-0`.

4. **Wizard de Ficha (`NovaFichaWizard.tsx`)** — header sticky com botões de navegação que não saem da tela e área de conteúdo com scroll próprio.

5. **`SignaturePad`** — canvas responsivo (`w-full h-40`) em vez de largura fixa.

## Problema 2 — Link Bio não funciona para o aluno criar

Sintomas atuais:
- O campo "slug" em `/account` aba **Link Bio** verifica duplicidade via `supabase.from("profiles").select("id").eq("slug", ...)` — mas a RLS de `profiles` só permite ler o próprio perfil, então a checagem **sempre devolve 0 e diz "disponível"**, mesmo se outro usuário já tiver o slug. No save, se houver UNIQUE no banco, falha sem mensagem clara.
- Não há sanitização do slug (aceita espaços, acentos, maiúsculas).
- Não há botão de **copiar link** nem **abrir preview**.
- O usuário não vê claramente qual URL final foi gerada.
- Sem feedback de sucesso óbvio.

### O que será feito

1. **Migration SQL**:
   - Criar índice `UNIQUE` em `profiles.slug` (parcial, ignorando NULL) caso ainda não exista.
   - Criar RPC `check_slug_available(_slug text)` com `SECURITY DEFINER` que retorna boolean — permite checagem sem expor outras linhas via RLS.
   - Criar RPC `set_my_slug(_slug text)` `SECURITY DEFINER` que valida formato (`^[a-z0-9-]{3,40}$`), checa duplicidade e grava no `profiles` do usuário autenticado, devolvendo `{ ok, error }`.

2. **`src/pages/AccountPage.tsx` — aba Link Bio**:
   - Sanitizar slug em tempo real: `value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9-]+/g,'-').replace(/-+/g,'-').replace(/^-|-$/g,'')`.
   - Mostrar contador 3–40 caracteres e regras (`a-z 0-9 -`).
   - Debounce 400 ms chamando `check_slug_available`. Estados: idle / checking / available / taken / invalid.
   - Ao salvar, chamar `set_my_slug` (e demais campos via update normal). Tratar erro retornado pela RPC com toast claro.
   - Quando há slug válido salvo, mostrar bloco destacado:
     - URL completa: `https://<host>/u/<slug>`
     - Botão **Copiar link**
     - Botão **Abrir preview** (`target="_blank"`)
     - QR code simples (gerado via `https://api.qrserver.com/v1/create-qr-code/?data=...&size=160x160`) para o aluno mostrar no celular.
   - Tornar o card todo responsivo (stack vertical no mobile, lado-a-lado no `sm:`).

3. **`src/pages/LinkBioPage.tsx`** — pequenos ajustes:
   - Confirmar que o estado vazio (`!profile`) explica que o slug ainda não existe.
   - Garantir `break-words` na bio e no nome para nomes longos.

## Detalhes técnicos

- Não tocar em `src/integrations/supabase/{client,types}.ts` — types regeneram automaticamente após a migration.
- Migration vai precisar de aprovação do usuário (tool de migration pede confirmação).
- Nenhuma mudança em rotas; `/u/:slug` continua público.
- `dateUtils`, AuthContext e RLS de outras tabelas permanecem como estão.

## Arquivos afetados

```text
NEW   supabase/migrations/<timestamp>_link_bio_slug.sql
EDIT  src/components/ui/dialog.tsx
EDIT  src/components/ui/input.tsx
EDIT  src/pages/AccountPage.tsx
EDIT  src/pages/LinkBioPage.tsx
EDIT  src/components/fichas/NovaFichaWizard.tsx
EDIT  src/components/fichas/SignaturePad.tsx
EDIT  src/components/modules/ClientesTab.tsx
EDIT  src/components/modules/AgendamentosTab.tsx
EDIT  src/components/modules/FinanceiroTab.tsx
EDIT  src/components/modules/EstoqueTab.tsx
EDIT  src/components/modules/ServicosTab.tsx
EDIT  src/components/modules/FichasTab.tsx
EDIT  src/components/modules/DashboardTab.tsx
```

## Fora do escopo desta etapa

- Upload de capa, temas claro/escuro/rosa do Link Bio, botões pré-configurados extra (Instagram/WhatsApp/Site/Catálogo) — entram numa próxima rodada de "Link Bio completo" se você quiser.
- Reescrita do wizard de ficha — só o ajuste de scroll/sticky aqui.
