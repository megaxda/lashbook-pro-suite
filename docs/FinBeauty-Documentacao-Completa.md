---
title: "FinBeauty — Documentação Completa"
subtitle: "Plataforma de gestão para estúdios de beleza e lash design"
author: "Equipe FinBeauty"
date: "2026"
lang: pt-BR
---

# 1. Identidade do Produto

- **Nome:** FinBeauty
- **Versão atual:** 6.0.0
- **Domínio:** app.finbeauty.com.br
- **Categoria:** SaaS de gestão financeira, agenda, CRM, estoque e fichas para profissionais da beleza
- **Público-alvo:** Lash designers, esteticistas, cabeleireiros, salões e estúdios de pequeno e médio porte que atendem por hora marcada e vendem serviços recorrentes.
- **Idioma:** Português brasileiro (pt-BR), moeda BRL, fuso local do usuário.
- **Tema visual:** Modo claro fixo, cor primária **#bd1a1b** (vermelho institucional).

# 2. Visão Geral

O FinBeauty concentra em um único aplicativo tudo o que uma profissional de beleza precisa para operar o dia a dia do estúdio: **agenda, clientes, financeiro, estoque, serviços, fichas de anamnese, equipe e um link de bio público para agendamentos**. Ele foi desenhado para eliminar o "malabarismo" entre planilha de contas, WhatsApp para agendar, caderno de anamnese e Instagram para receber cliente nova.

## 2.1 Problema que resolve

- Perda de receita por agendamento não confirmado ou esquecido.
- Falta de visibilidade financeira (quanto entrou, quanto saiu, qual é o lucro real).
- Anamnese em papel, difícil de arquivar e recuperar.
- Estoque de insumos sem controle, gerando compras erradas.
- Ausência de um canal público próprio para novas clientes agendarem sem intermédio.

## 2.2 Diferenciais

- **Agenda no modelo Google Calendar** com colisão em colunas, blocos de indisponibilidade e recorrência.
- **Receita automática** ao concluir um agendamento (trigger no banco).
- **Financeiro Negócio + Financeiro Pessoal** completamente isolados.
- **Link da bio próprio** (`/u/:slug`) com fluxo em 4 etapas e upload de comprovante PIX.
- **Fichas com assinatura digital**, fotos de antes/depois e baixa automática no estoque.
- **Multi-profissional** com cor por membro e filtro visual na agenda.
- **Modo Demo** para conhecer o app sem cadastrar dado real.

# 3. Personas e Jornadas

| Persona | Necessidade principal | Como o app atende |
|---|---|---|
| Profissional autônoma | Organizar a agenda e ver quanto ganhou | Início + Agendamentos + Financeiro |
| Dona de estúdio com equipe | Controlar equipe, comissões e ocupação | Equipe + filtro por profissional + relatórios |
| Cliente final | Agendar sem ligar/mandar mensagem | Link `/u/:slug` público |
| Admin da plataforma | Gerir contas, prazos e usuários | `/admin` com edge functions protegidas |

## 3.1 Rotina diária típica do usuário

1. **Manhã:** abre `Início`, confere KPIs do dia e a mini-agenda.
2. **Durante o expediente:** cada atendimento finalizado é marcado como **Concluído** com forma de pagamento — o sistema **gera automaticamente a receita** no Financeiro.
3. **Entre atendimentos:** responde novos agendamentos que chegaram pelo Link da Bio (aprovar/recusar), atualiza fichas, dá baixa em insumos usados.
4. **Fim do dia:** revisa Financeiro do dia, confere sinais recebidos e comprovantes.
5. **Semana:** olha comparativo mensal, exporta CSV, avalia clientes sem retorno para follow-up via WhatsApp.

# 4. Arquitetura e Estrutura de Navegação

## 4.1 Stack

- **Frontend:** React 18, Vite 5, TypeScript 5, Tailwind CSS v3, shadcn/ui, Recharts, @dnd-kit, React Router, React Query, Zod, react-joyride.
- **Backend (Lovable Cloud):** Postgres com RLS, Auth, Storage e Edge Functions (Deno).
- **Caching:** React Query com `staleTime` de 60s e prefetch pós-login das entidades essenciais (clientes, serviços, profissionais, estoque).
- **Validação:** Zod centralizado em `src/lib/validation.ts`.
- **PWA:** `manifest.json` + `sw.js` com Web Push (VAPID).

## 4.2 Rotas

| Rota | Descrição | Proteção |
|---|---|---|
| `/auth` | Login e cadastro | Pública |
| `/home_profissional` | App principal (tabs via `?tab=`) | Autenticada + não bloqueada |
| `/account` | Configurações da conta | Autenticada |
| `/admin` | Painel administrativo | Somente `role = admin` |
| `/u/:slug` | Link de bio público | Pública |
| `/trust` | Página de confiança/segurança | Pública |
| `/creatifin` | Onboarding especial de origem | Pública |

## 4.3 Layout responsivo

- **Desktop:** sidebar esquerda colapsável (`AppSidebar`).
- **Mobile:** drawer overlay + bottom nav com 4 itens (Início, Clientes, Financeiro, Conta) e botão hamburger fixo `top-3 left-3 z-50`. Conteúdo principal tem `pt-12` para não ficar atrás do botão.

# 5. Módulos e Funcionalidades

## 5.1 Autenticação e Onboarding

- Cadastro por e-mail e senha, sem confirmação obrigatória (fluxo rápido); esquema Zod (`signUpSchema`) valida nome ≥2, e-mail e senha ≥6.
- Após login, `AuthContext` faz **prefetch** paralelo de clientes, serviços, profissionais e estoque.
- **Tour guiado** (`AppTour` + `TourTooltip`) em português, com cards estilizados, dispara automaticamente no primeiro login e pode ser refeito em Configurações → "Refazer tour".
- **Modo Demo:** botão dedicado cria uma sessão fictícia (`DEMO_USER_ID`) com dados de exemplo em `src/data/demoData.ts` — não escreve nada no banco.
- **Bloqueio de conta:** se `access_expires_at` já passou e o usuário não é admin, a UI mostra `AccountBlocked` e o banco também bloqueia via `account_is_active()` nas RLS.

## 5.2 Início / Dashboard

- KPIs do dia (agendamentos, receita esperada, receita realizada).
- Mini-agenda usando o mesmo `AgendaGrid` da aba Agendamentos.
- Atalhos rápidos para criar cliente, agendamento e lançamento financeiro.
- Persistência local da view selecionada (Diária/Semanal/Mensal) por aba.

## 5.3 Agendamentos

- **Componente compartilhado `AgendaGrid`** usado no Dashboard e na aba Agendamentos.
- **Views:** Diária, Semanal, Mensal — cada uma com sua persistência em `localStorage`.
- **Grid padronizado:** 56px por hora, janela padrão 07:00–22:00, expande automaticamente até 00:00–24:00 para caber blocos fora do padrão.
- **Cards mostram 3 linhas fixas:**
  1. **Nome do cliente** (negrito)
  2. **Horário** no formato `HH:mm – HH:mm` (fim calculado por `horario + duracao_min || servicos.duracao || 60`)
  3. **Serviço** (itálico)
- **Cores por status:**

| Status | Cor | Token |
|---|---|---|
| Concluído | Verde | `--status-concluido` |
| Confirmado | Azul | `--status-confirmado` |
| Pendente | Amarelo | `--status-pendente` |
| Cancelado | Vermelho | `--status-cancelado` |
| A confirmar | Rosa | `--status-confirmar` |
| Bloqueio | Roxo com listras | `--block` |

- **Colisão:** agendamentos que se sobrepõem no mesmo profissional são renderizados lado a lado em colunas.
- **Bloqueios de indisponibilidade** exigem motivo e aparecem preenchidos em roxo.
- **Duração customizada por agendamento:** campo `duracao_min` no modal (5–480 min) com botão "Padrão" para voltar ao tempo do serviço.
- **Recorrência:** série agrupada por `recorrencia_id` (ex.: a cada 21 dias) com controle "Repetir até".
- **Filtro por profissional:** chips coloridos no topo da agenda.
- **Validação visível no modal:** banner `role="alert"` no topo + `aria-invalid` + mensagem por campo obrigatório (cliente, data, horário, serviço, profissional, repetir até).
- **Conclusão de atendimento:** ao marcar Concluído + forma de pagamento, o trigger de banco `trg_agendamento_concluido_to_receita` cria a receita correspondente. O modal só fecha após confirmação real do UPDATE (`.select().maybeSingle()`).

## 5.4 Clientes

- **Chips de filtro:** Ativos, Inativos, Aniversariantes, Sem retorno.
- **Busca multi-token** (ex.: "paula silva" encontra "Ana Paula Silva") com normalização de acentos (`src/lib/searchUtils.ts`).
- **Drawer detalhado** com histórico de agendamentos, estatísticas financeiras e notas.
- **Ações rápidas:** WhatsApp (wa.me com template) e "Novo agendamento" já preenchido.
- Cadastro com Zod (`clienteSchema`): nome, telefone, e-mail, observações.

## 5.5 Financeiro — modo Negócio

- **Toggle "Negócio | Pessoal"** logo abaixo do título, persistido em `localStorage` (`fin_mode`).
- **Seletor de período:** Hoje, 7 dias, Mês atual, Mês anterior, Personalizado.
- **KPIs com trend:** Receita, Despesa, Lucro, Ticket Médio, Lançamentos, Atendimentos concluídos. Despesa usa trend invertido.
- **Gráfico principal:** `ComposedChart` com barras Receita (verde) + Despesa (vermelha) e linha Lucro (azul) por dia.
- **Despesas por categoria:** `PieChart` + lista lateral com R$ e %.
- **Tabela unificada** com filtros (tipo, categoria, busca), ordenação e paginação 20/pg.
- **Coluna Origem:** badge "Agendamento" (quando existe `agendamento_id`) ou "Manual". Lançamentos vindos de agendamento **não podem** ser editados/excluídos por aqui — precisam ser ajustados no próprio agendamento.
- **Exportação CSV:** respeita filtros, formato pt-BR com BOM UTF-8 (`;` separador), colunas separadas (Data, Tipo, Serviço, Cliente, Profissional, Valor).
- **Comparativo 6 meses:** tabela com Receita / Despesa / Lucro / Margem %.
- **Sinal + comprovante PIX:** controlados por `agendamentos.sinal_pago` e `comprovante_url`.
- **Input de moeda:** `CurrencyInputBRL` com máscara em centavos (digitar "11237" resulta em "R$ 11.237,00") — corrige o bug clássico de parse decimal.

## 5.6 Financeiro — modo Pessoal

- Tabela **`financeiro_pessoal`** completamente separada da `financeiro`, com RLS `user_id = auth.uid()`.
- Sem `agendamento_id`, sem `profissional_id`, com categorias próprias (Salário, Investimentos, Alimentação, Moradia, Transporte, Saúde, Educação, Lazer, Compras, Outros).
- 3 KPIs: Entradas, Saídas, Saldo do período.
- Gráfico único de barras Entradas × Saídas por dia + Pie de categorias.
- Botões **+ Nova entrada** e **+ Nova saída** abrem modal simples.
- Exportação CSV separada (`financas-pessoais-YYYY-MM-DD.csv`).
- **Isolamento total:** nada de Pessoal aparece no Dashboard, no comparativo 6 meses ou nos relatórios do negócio, e vice-versa.

## 5.7 Estoque

- Cadastro sem SKU (nome, unidade, quantidade, mínimo, valor unitário).
- Alertas visuais quando abaixo do mínimo.
- Reposição sugerida automática baseada em consumo médio.
- Baixa automática via Ficha (quando o serviço registra insumos usados).

## 5.8 Serviços

- Cadastro de serviços com duração padrão, valor, categoria e status ativo/inativo.
- Duração alimenta o cálculo automático do fim do agendamento na agenda.

## 5.9 Fichas e Anamnese

- Wizard `NovaFichaWizard` com etapas customizáveis (`anamneseConfig.ts`).
- **Assinatura digital** via `SignaturePad`.
- **Fotos de antes e depois** anexadas por ficha.
- **Baixa automática no estoque** dos insumos declarados.
- **Exportação em PDF** (`fichaPdf.ts`).

## 5.10 Equipe / Multi-profissional

- Tabela `profissionais` (nome, cor, ativo).
- Cada agendamento e cada lançamento financeiro pode ter `profissional_id`.
- Gerido em `EquipeManager` dentro de `AccountPage`.
- Trigger automático preserva o profissional no lançamento de receita.
- Filtro por profissional na agenda com chips coloridos.

## 5.11 Link da Bio (`/u/:slug`)

Fluxo público em 4 etapas:

1. Seleção de serviço (lista pública via função `SECURITY DEFINER` `get_public_profile_by_slug`).
2. Seleção de profissional (via `get_public_profissionais_by_slug`).
3. Escolha de data e horário livres.
4. Dados da cliente + upload opcional de comprovante PIX (se sinal ativo).

- Validação via `publicBookingSchema` (nome, telefone BR, e-mail opcional, observações ≤500).
- Upload restrito a JPG/PNG/WEBP/PDF ≤ 5 MB.
- Comprovante vai para bucket `comprovantes` em pasta com o slug do profissional.

## 5.12 Configurações da Conta

- Perfil (nome, foto, bio, redes sociais).
- Chave PIX + tipo + valor do sinal + toggle "Cobrar sinal".
- Horários de funcionamento (`studio_hours`).
- `follow_up_days` para o filtro "Sem retorno" em Clientes.
- Gestão da Equipe.
- Botão "Refazer tour".

## 5.13 Painel Administrativo (`/admin`)

- Analytics básico (totais de usuários, ativos, bloqueados).
- Gestão de usuários: **Estender prazo**, **Liberar para sempre**, **Bloquear agora**.
- Criação de usuários via edge function `admin-create-user` com senha gerada por `crypto.getRandomValues()` (14 caracteres).
- Atualizações via edge function `admin-update-user` com service role e verificação de admin — retorno `.select()` real e erro visível ao usuário.
- Envio de push notification via `send-push`.
- Todas as edge functions administrativas verificam o papel de admin no início.

## 5.14 Página de Confiança (`/trust`)

Página pública explicando o modelo de responsabilidade compartilhada (lógica do app × infraestrutura da plataforma), políticas de dados e canais de contato.

## 5.15 Notificações Push

- Chave VAPID obtida via `get-vapid-public-key`.
- Registro em `push_subscriptions` (upsert por endpoint) feito automaticamente após login quando a permissão já foi concedida.
- Envio disparado pelo backend via `send-push` (validação Zod na entrada).

# 6. Regras de Negócio-Chave

- **Trigger `trg_agendamento_concluido_to_receita`:** ao mudar status para `concluido`, insere linha em `financeiro` com `agendamento_id`, `profissional_id` e valor do serviço.
- **RLS por `user_id`:** todas as tabelas de negócio (agendamentos, clientes, financeiro, financeiro_pessoal, servicos, estoque, fichas, profissionais) exigem `auth.uid() = user_id`.
- **`account_is_active()`:** função server-side usada nas RLS para bloquear acesso quando a conta expirou.
- **Papéis via tabela `user_roles`** (nunca em `profiles`) + função `has_role()` `SECURITY DEFINER` para evitar recursão.
- **Isolamento Negócio × Pessoal:** consultas de um modo nunca leem a tabela do outro.
- **Sinal + comprovante:** `sinal_pago` (booleano) + `comprovante_url` (Storage). Cleanup periódico de comprovantes órfãos via `cleanup-comprovantes` protegido por header `x-cleanup-secret`.

# 7. Padrão de Design

## 7.1 Princípios

- **Tema claro fixo** (dark mode removido).
- Cor primária **#bd1a1b**, fundo branco, texto escuro.
- Tokens semânticos em `src/index.css` — nunca cores hardcoded nas classes (nada de `bg-black`, `text-white`).
- Componentes shadcn/ui customizados por variantes.
- Ícones Lucide.
- Tipografia limpa, com hierarquia forte em títulos.

## 7.2 Cores de status (tokens)

| Token | Uso |
|---|---|
| `--primary` | Ações principais, marca |
| `--status-concluido` | Verde — atendimento realizado |
| `--status-confirmado` | Azul — confirmado pela cliente |
| `--status-pendente` | Amarelo — aguardando |
| `--status-cancelado` | Vermelho — cancelado |
| `--status-confirmar` | Rosa — procedimento a confirmar |
| `--block` | Roxo listrado — indisponibilidade |

## 7.3 Componentes recorrentes

- `AgendaGrid` — grid de agenda compartilhada.
- `ClientCombobox` — busca de cliente com multi-token e alfabetização.
- `CurrencyInputBRL` — input monetário com máscara em centavos.
- `TourTooltip` — cards estilizados do onboarding.
- Drawers laterais para detalhes de cliente e histórico.

## 7.4 Acessibilidade

- Erros de formulário com `role="alert"`, `aria-invalid` e borda vermelha.
- Botões com rótulos claros e áreas de toque adequadas.
- Contraste calibrado no tema claro.

# 8. Segurança e Privacidade

- **RLS habilitada** em todas as tabelas com `user_id` e políticas explícitas.
- **GRANTs explícitos** para `authenticated` e `service_role` em todas as tabelas públicas (sem `anon` quando desnecessário).
- **Funções `SECURITY DEFINER`** para exposição pública controlada:
  - `get_public_profile_by_slug`
  - `get_public_profissionais_by_slug`
  - `has_role`
  - `account_is_active`
- **Storage:**
  - Bucket `comprovantes` sem leitura pública ampla; upload permitido apenas em pasta com slug válido.
  - Bucket `anexos` com política de UPDATE restrita ao dono.
- **Edge functions:**
  - `cleanup-comprovantes` exige header `x-cleanup-secret`.
  - `admin-*` verificam papel de admin.
  - Zod valida entrada em `send-push` e `admin-create-user`.
- **Senhas:** HIBP (Have I Been Pwned) habilitado no Auth.
- **Geração de senha admin:** `crypto.getRandomValues()` (não `Math.random`).
- **Sem admin hardcoded:** removida a função `auto_promote_known_admins`.
- **Bloqueio a nível de banco** por `access_expires_at`.
- **Página `/trust`** documenta postura de segurança para as clientes finais.

# 9. Operação e Manutenção

- **Modo Demo:** para demonstrações comerciais sem tocar em dados reais.
- **Estender prazo de um usuário:** `/admin` → botão "Estender prazo" (chama `admin-update-user`).
- **Liberar para sempre:** mesmo painel, botão "Liberar para sempre" (define `access_expires_at = NULL`).
- **Bloquear agora:** define `access_expires_at` para o passado.
- **Refazer tour:** Configurações → botão dedicado (reseta `onboarding_completed`).
- **Reprocessar receita perdida:** basta reabrir o agendamento e marcar como Concluído novamente — o trigger é idempotente pela verificação de duplicidade.
- **Limpeza de comprovantes órfãos:** cron chama `cleanup-comprovantes` com header secreto.

# 10. Modelo de Dados (resumo)

Tabelas principais no schema `public`:

- `profiles` — dados do usuário logado.
- `user_roles` — papéis (`admin`, `user`, `moderator`).
- `clientes`, `servicos`, `estoque`, `profissionais`.
- `agendamentos` (com `duracao_min`, `recorrencia_id`, `sinal_pago`, `comprovante_url`).
- `financeiro` (com `agendamento_id`, `profissional_id`, `pagamentos_detalhe`).
- `financeiro_pessoal` (isolada).
- `fichas` + tabelas auxiliares de anamnese/foto/assinatura.
- `push_subscriptions`.

Todas com `created_at`, `updated_at` e trigger `update_updated_at_column`.

# 11. Roadmap Curto

- Notificações push por evento (novo agendamento, cancelamento, cliente sem retorno).
- Relatório de comissão por profissional.
- App mobile empacotado (PWA já instalável).
- Integração com meios de pagamento além do PIX manual.

# 12. Glossário

- **Sinal:** parte do valor do serviço cobrada antecipadamente para reservar o horário.
- **Comprovante:** arquivo (imagem ou PDF) enviado pela cliente confirmando o PIX do sinal.
- **Follow-up:** ação de contatar clientes que não voltam há X dias.
- **Recorrência:** série de agendamentos que se repetem em intervalo fixo.
- **Colisão:** dois ou mais agendamentos sobrepostos no mesmo horário.
- **Bloco de agenda:** faixa de tempo em que o profissional não atende (almoço, folga, curso).
- **Ficha:** conjunto de anamnese + evolução + fotos de um atendimento.
- **Anamnese:** questionário de saúde e histórico preenchido antes do procedimento.
