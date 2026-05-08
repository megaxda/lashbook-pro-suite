## Problemas identificados

**1. Erro: `agendamentos_origem_check`**
A função `create_public_booking` insere `origem = 'link_bio'`, mas a constraint do banco só aceita `'interno'` ou `'linkbio'` (sem underscore). Por isso TODO agendamento via Link Bio falha — com ou sem comprovante.

**2. Erro: `Invalid key: nathan/...{C0D77960-...}.png`**
O upload do comprovante usa o nome original do arquivo (que contém `{`, `}`, espaços, acentos). O Supabase Storage rejeita esses caracteres na key.

## Correções

### Migração no banco
Atualizar a função `create_public_booking` para inserir `origem = 'linkbio'` (alinhado com a constraint existente). Não vou alterar a constraint para evitar quebrar dados antigos.

### `src/pages/LinkBioPage.tsx`
Sanitizar o nome do arquivo antes do upload no bucket `comprovantes`:
- Extrair extensão
- Gerar nome seguro: `${slug}/${timestamp}-${randomId}.${ext}` (sem o nome original)

Isso elimina qualquer caractere inválido e ainda mantém unicidade.

## Arquivos
- Nova migração SQL (atualizar função `create_public_booking`)
- `src/pages/LinkBioPage.tsx` (sanitização do path do comprovante)

Sem outras mudanças.
