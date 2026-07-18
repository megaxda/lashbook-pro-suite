# Plano — Documentação Completa do FinBeauty

## Objetivo
Criar um documento único, detalhado e navegável descrevendo tudo o que o app faz hoje: propósito, público, arquitetura, módulos, rotinas de uso, regras de negócio, padrão de design, segurança e operação. Serve como material de referência interna, onboarding de novos usuários/colaboradores e apresentação institucional.

## Entregáveis

1. `docs/FinBeauty-Documentacao-Completa.md` — versão markdown (fonte da verdade, fácil de manter e versionar).
2. `docs/FinBeauty-Documentacao-Completa.docx` — versão formatada para leitura/impressão/compartilhamento, gerada a partir do markdown com a skill `docx` (capa, sumário, títulos hierárquicos, tabelas, tipografia legível).
3. `docs/README.md` curto apontando para os dois arquivos acima.

Ambos ficam dentro do repositório, na pasta `docs/`, sem afetar build ou runtime.

## Estrutura do documento

1. **Capa e identidade** — Nome, versão (6.0.0), tagline, data, público-alvo (estúdios de lash design / salões de beleza).
2. **Visão geral do produto** — O que é, problema que resolve, diferenciais (gestão financeira + agenda + link de bio + fichas + estoque em um só lugar).
3. **Personas e jornada** — Profissional autônoma, dona de estúdio, cliente final agendando via link público, admin da plataforma.
4. **Rotina diária do usuário** — Passo a passo típico: abrir Início → conferir agenda do dia → concluir atendimentos (dispara receita) → responder novos agendamentos do link da bio → dar baixa em estoque → revisar Financeiro no fim do dia/semana.
5. **Módulos e funcionalidades** (uma seção por módulo, com o que faz, campos, ações, regras):
   - Autenticação e onboarding (cadastro, login, tour guiado, modo demo).
   - Início / Dashboard (KPIs, mini-agenda, atalhos).
   - Agendamentos (grid Google-like, views Dia/Semana/Mês, cores por status, blocos de indisponibilidade, recorrência, duração customizada por agendamento, colisão em colunas).
   - Clientes (chips de filtro, busca multi-token, drawer com histórico e estatísticas, WhatsApp).
   - Financeiro — modo Negócio (KPIs com trend, gráfico composto, tabela unificada, origem Agendamento/Manual, exportação CSV, comparativo 6 meses, sinal + comprovante PIX).
   - Financeiro — modo Pessoal (aba separada, categorias próprias, CSV isolado).
   - Estoque (alertas, reposição sugerida, baixa via ficha).
   - Serviços (cadastro, duração, valor, ativos/inativos).
   - Fichas / Anamnese (wizard, assinatura, fotos antes/depois, PDF, baixa de estoque).
   - Equipe / Multi-profissional (cadastro, cor, filtro na agenda, vínculo em agendamento e receita).
   - Link da Bio pública `/u/:slug` (fluxo em 4 etapas, upload de comprovante, validações).
   - Conta / Configurações (perfil, PIX, horário de funcionamento, follow-up, refazer tour).
   - Painel Admin (gestão de usuários, prazo/liberação, criação de usuários, push, analytics básico).
   - Página de Confiança (`/trust`).
   - Notificações Push (VAPID, service worker).
6. **Regras de negócio-chave** — Trigger de conclusão → receita, RLS por `user_id`, bloqueio por `access_expires_at`, papéis via tabela `user_roles`, isolamento total Negócio × Pessoal, sinal + comprovante.
7. **Padrão de design** — Tema claro fixo, cor primária `#bd1a1b` (vermelho), tokens semânticos em `index.css`, tipografia, componentes shadcn, layout responsivo (sidebar desktop / bottom nav mobile), estados de status coloridos (verde/azul/amarelo/vermelho/roxo/rosa), tour com cards estilizados, moeda pt-BR em inputs.
8. **Arquitetura técnica (resumida, sem jargão desnecessário)** — React + Vite + TS + Tailwind + shadcn + React Query + Recharts + @dnd-kit; backend Lovable Cloud (Auth, Postgres com RLS, Storage, Edge Functions); caching com React Query + prefetch pós-login; validação com Zod; navegação por `?tab=`.
9. **Segurança e privacidade** — RLS em todas as tabelas, GRANTs explícitos, funções `SECURITY DEFINER` para acesso público controlado (`get_public_profissionais_by_slug`, `get_public_profile_by_slug`), edge function `cleanup-comprovantes` protegida por header secreto, HIBP habilitado, geração segura de senha no admin, bloqueio a nível de banco por expiração de conta, ausência de admin hardcoded.
10. **Operação e manutenção** — Modo demo, backups (via plataforma), como estender o prazo de um usuário, como reprocessar receita perdida, como refazer o tour.
11. **Roadmap curto (opcional)** — Espaço para próximos passos combinados.
12. **Glossário** — Sinal, comprovante, follow-up, recorrência, colisão, bloco de agenda, ficha, anamnese.

## Como será construído

- Fonte primária: os próprios arquivos do projeto (memórias em `.lovable/memory/*`, componentes em `src/components/modules/*`, hooks, edge functions, migrations recentes). Nada será inventado — cada seção descreve comportamento já existente no código.
- Markdown escrito com títulos H1–H3, listas, tabelas para módulos × ações, blocos de código só onde agregam (ex.: exemplos de status, formato de CSV).
- .docx gerado pela skill `docx` com:
  - Capa (título grande, subtítulo, versão, data).
  - Sumário automático (TOC baseado em Heading 1–3).
  - Cabeçalhos e rodapés com número de página.
  - Tabelas com bordas claras e sombreamento leve para cabeçalho.
  - Fonte Arial 11pt, títulos em vermelho `#bd1a1b` para reforçar identidade.
  - Validação obrigatória do .docx após geração.

## Fora de escopo

- Nenhuma mudança em código do app, banco, migrations, RLS ou UI.
- Não gera capturas de tela automáticas (podem ser adicionadas manualmente depois se quiser).
- Não altera memórias existentes.
