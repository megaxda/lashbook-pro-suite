# Exportar dados da conta

Adicionar uma forma do usuário baixar todos os dados da conta dele, em formato que possa ser importado em outro app.

## O que o usuário verá

Nova aba **"Meus dados"** em Configurações, com um card "Exportar dados da conta":

- Botão **Baixar tudo (JSON)** — um único arquivo com todo o conteúdo da conta (perfil, clientes, serviços, profissionais, agendamentos, financeiro, financeiro pessoal, estoque, fichas, bloqueios de agenda).
- Botões de **CSV por área**: Clientes, Agendamentos, Financeiro, Serviços, Estoque, Fichas — cada um baixa uma planilha separada, pronta para abrir no Excel/Google Sheets ou importar em outro sistema.
- Texto explicando que os arquivos incluem apenas dados da própria conta e que fotos/anexos continuam nos links salvos dentro do export.
- Estado de carregando por botão e aviso de erro caso alguma consulta falhe.

Nome dos arquivos: `finbeauty-<area>-AAAA-MM-DD.csv` e `finbeauty-backup-AAAA-MM-DD.json`.

## Detalhes técnicos

- Novo arquivo `src/lib/exportData.ts`:
  - `fetchAccountData(userId)` — consultas paralelas às tabelas do usuário via cliente do backend (todas já filtradas por `user_id` e protegidas por RLS).
  - `toCSV(rows, columns)` — gera CSV com cabeçalho em português, separador `;` (padrão pt-BR), escape de aspas e BOM UTF-8 para abrir corretamente no Excel.
  - `downloadFile(name, content, mime)` — helper com Blob + link temporário.
  - Nos CSVs de agendamentos e financeiro, resolver nomes (cliente, serviço, profissional) a partir dos dados já carregados, em vez de exportar só os IDs.
- Novo componente `src/components/conta/ExportarDados.tsx` com a UI dos botões, usando os componentes shadcn existentes e os tokens de tema.
- `src/pages/AccountPage.tsx`: adicionar `TabsTrigger`/`TabsContent` "Meus dados" renderizando o novo componente.
- Sem mudanças de banco de dados e sem novas permissões: tudo roda com a sessão atual do usuário.
