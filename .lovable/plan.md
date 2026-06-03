## Reformular Agenda no estilo Google Calendar

Foco da entrega: tornar a Agenda visualmente clara (bate o olho → sabe horário, cliente, procedimento, bloqueio e status) e padronizar Início ↔ Agendamento. Apenas frontend/UX + uma chave em localStorage. Nenhuma mudança de banco.

### 1. Alinhamento dos horários (Semanal / Mensal)
- Substituir a grade atual por um grid com altura de slot **fixa** (60px por hora, 1 célula por hora) e posicionamento absoluto dos eventos calculado em px (`top = (minutosDesdeInicio / 60) * 60`).
- Coluna de horas com a **mesma altura por linha** que a grid de eventos e label renderizado no **topo** da célula (alinhado à linha divisória), eliminando o drift de 1px.
- Aplicar em `DashboardTab.tsx` (Início → Semanal) e `AgendamentosTab.tsx` (Semanal).

### 2. Horários antes das 07h e depois das 21h
- Hoje o grid é fixo 07–21h, então um 06:00 ou 22:00 fica invisível.
- Mudar para janela **dinâmica**: padrão 07–21h, mas se houver qualquer agendamento/bloqueio do dia/semana fora dessa faixa, expandir automaticamente o grid (com snap em hora cheia) para cobrir tudo, de 00h até 23h se necessário.
- O usuário não precisa configurar nada — funciona "automágico" como o Google Calendar.

### 3. Bloqueios visíveis e diferenciados
- Em todas as vistas (Diário / Semanal / Mensal / Lista / modal do dia) o bloco mostra o **motivo** (`bloqueios_agenda.motivo`) como rótulo principal. Fallback "Bloqueado" só quando vazio.
- Cor própria para bloqueios: faixa/borda em tom **roxo** (token semântico novo `--block`), distinta do vermelho/azul dos agendamentos. Padrão listrado leve mantido para reforçar "indisponível".
- Tooltip com motivo completo + horário.

### 4. Procedimento visível nos cards
- Card de agendamento (Semanal/Mensal) passa a exibir 2 linhas: `Cliente` (negrito) e `Serviço · HH:mm–HH:mm` (regular menor). Trunca com ellipsis quando o card é curto.
- Mensal: chip vira `HH:mm Cliente · Serviço` truncado.
- Tooltip continua com tudo no hover.

### 5. Destaque visual do status
- Cores semânticas por status no card e na lista:
  - **Concluído com pagamento**: verde sólido + ícone ✓ + selo da forma de pagamento (PIX/Dinheiro/Cartão).
  - **Confirmado**: azul.
  - **Pendente**: cinza/borda tracejada.
  - **Cancelado**: vermelho desbotado, riscado.
  - **Bloqueio**: roxo listrado.
- Adicionar legenda compacta no topo da Agenda (chips com as cores).

### 6. Busca de clientes (combobox)
- Já existe `ClientCombobox`. Garantir que está em uso em **todos** os lugares que selecionam cliente (Novo Agendamento e Editar de `AgendamentosTab` + `DashboardTab` + bloqueio com cliente, se houver).
- Reforçar busca: normalizar acentos, case-insensitive, **match por substring em qualquer palavra** (split por espaço e checar cada token, então "paula" e "silva paula" encontram "Ana Paula Silva").
- Ordem alfabética pt-BR (`localeCompare` `sensitivity: base`).
- Mostrar telefone abreviado abaixo do nome quando houver homônimos para desambiguar (ex: "Ana Paula — (11) 9••••-1234").

### 7. Replicar visualização Início ↔ Agendamento
- Extrair a grade da aba Início para um componente reutilizável `AgendaGrid` (ou usar o mesmo render do `DashboardTab` na `AgendamentosTab`).
- Mesma aparência de cards, mesmas cores, mesmo header de navegação Diário/Semanal/Mensal nas duas abas.

### 8. Persistir última visualização
- Salvar o modo escolhido (Diário/Semanal/Mensal) em `localStorage` por aba: `finbeauty.agenda.view` e `finbeauty.dashboard.view`.
- Ao montar, ler do localStorage com fallback para Semanal.
- Após criar/editar/excluir agendamento ou bloqueio, **NÃO** resetar a visualização. Apenas reconsultar dados.

### 9. Pagamento zerado / cortesia (rever)
- Confirmar que o fluxo de "concluir com pagamento zerado" (cortesia/retorno) continua funcional após o redesenho do modal de conclusão — sem alterar regra de negócio, só garantir que o badge "Cortesia" apareça destacado no card concluído.

## Arquivos a alterar
- `src/components/modules/AgendamentosTab.tsx` (grid, persistência, cards, modais, bloqueio com motivo/cor)
- `src/components/modules/DashboardTab.tsx` (mesma grid, persistência, cards)
- `src/components/ui/ClientCombobox.tsx` (busca multi-token + telefone para desambiguar)
- `src/index.css` (novos tokens semânticos: `--block`, `--status-done`, `--status-confirmed`, `--status-pending`, `--status-canceled`)
- (Opcional) novo `src/components/agenda/AgendaGrid.tsx` para deduplicar a grade entre Início e Agendamento.

## Fora do escopo
- Mudanças de schema/migrações.
- Telas de Clientes, Financeiro, Estoque, Fichas (ficam para próximas iterações conforme prioridade que você listou).
- Sincronização real com Google Calendar (somente inspiração visual).

## Ordem de implementação
1. Tokens de cor + componente `AgendaGrid` compartilhado + alinhamento dos horários + janela dinâmica 24h.
2. Cards com procedimento, bloqueio com motivo+cor, status com cores e ícones.
3. Combobox de cliente reforçado + uso em todos os modais.
4. Persistência da visualização (`localStorage`) em Início e Agendamento.
5. Polimento e revisão visual lado a lado com referência Google Agenda.

Confirma este escopo para eu implementar?