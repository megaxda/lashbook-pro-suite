import { supabase } from "@/integrations/supabase/client";

export type AnyRow = Record<string, any>;

export interface AccountData {
  perfil: AnyRow | null;
  clientes: AnyRow[];
  servicos: AnyRow[];
  profissionais: AnyRow[];
  agendamentos: AnyRow[];
  financeiro: AnyRow[];
  financeiro_pessoal: AnyRow[];
  estoque: AnyRow[];
  fichas: AnyRow[];
  bloqueios_agenda: AnyRow[];
}

async function all(table: string, userId: string): Promise<AnyRow[]> {
  const { data, error } = await supabase.from(table as any).select("*").eq("user_id", userId);
  if (error) throw new Error(`${table}: ${error.message}`);
  return (data as AnyRow[]) ?? [];
}

export async function fetchAccountData(userId: string): Promise<AccountData> {
  const [
    perfilRes,
    clientes,
    servicos,
    profissionais,
    agendamentos,
    financeiro,
    financeiro_pessoal,
    estoque,
    fichas,
    bloqueios_agenda,
  ] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    all("clientes", userId),
    all("servicos", userId),
    all("profissionais", userId),
    all("agendamentos", userId),
    all("financeiro", userId),
    all("financeiro_pessoal", userId),
    all("estoque", userId),
    all("fichas", userId),
    all("bloqueios_agenda", userId),
  ]);

  if (perfilRes.error) throw new Error(`perfil: ${perfilRes.error.message}`);

  return {
    perfil: (perfilRes.data as AnyRow) ?? null,
    clientes,
    servicos,
    profissionais,
    agendamentos,
    financeiro,
    financeiro_pessoal,
    estoque,
    fichas,
    bloqueios_agenda,
  };
}

function cell(value: unknown): string {
  if (value === null || value === undefined) return "";
  const raw = typeof value === "object" ? JSON.stringify(value) : String(value);
  return `"${raw.replace(/"/g, '""')}"`;
}

/** Gera CSV com separador ";" (padrão pt-BR) e BOM UTF-8 para abrir bem no Excel. */
export function toCSV(rows: AnyRow[], columns: { key: string; label: string }[]): string {
  const header = columns.map((c) => cell(c.label)).join(";");
  const body = rows.map((r) => columns.map((c) => cell(r[c.key])).join(";"));
  return "\uFEFF" + [header, ...body].join("\r\n");
}

export function downloadFile(filename: string, content: string, mime: string) {
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}

const byId = (rows: AnyRow[]) => new Map(rows.map((r) => [r.id, r]));

export type ExportArea =
  | "clientes"
  | "agendamentos"
  | "financeiro"
  | "servicos"
  | "estoque"
  | "fichas";

export const AREA_LABELS: Record<ExportArea, string> = {
  clientes: "Clientes",
  agendamentos: "Agendamentos",
  financeiro: "Financeiro",
  servicos: "Serviços",
  estoque: "Estoque",
  fichas: "Fichas",
};

/** Monta o CSV de uma área a partir dos dados completos da conta. */
export function buildAreaCSV(area: ExportArea, d: AccountData): string {
  const clientes = byId(d.clientes);
  const servicos = byId(d.servicos);
  const profs = byId(d.profissionais);

  switch (area) {
    case "clientes":
      return toCSV(d.clientes, [
        { key: "nome", label: "Nome" },
        { key: "telefone", label: "Telefone" },
        { key: "email", label: "Email" },
        { key: "birthday", label: "Aniversário" },
        { key: "status", label: "Status" },
        { key: "notas", label: "Notas" },
        { key: "created_at", label: "Criado em" },
        { key: "id", label: "ID" },
      ]);

    case "agendamentos": {
      const rows = d.agendamentos.map((a) => ({
        ...a,
        cliente_nome: clientes.get(a.cliente_id)?.nome ?? "",
        servico_nome: servicos.get(a.servico_id)?.nome ?? "",
        profissional_nome: profs.get(a.profissional_id)?.nome ?? "",
        duracao: a.duracao_min ?? servicos.get(a.servico_id)?.duracao ?? "",
        valor: servicos.get(a.servico_id)?.preco ?? "",
      }));
      return toCSV(rows, [
        { key: "data", label: "Data" },
        { key: "horario", label: "Horário" },
        { key: "duracao", label: "Duração (min)" },
        { key: "cliente_nome", label: "Cliente" },
        { key: "servico_nome", label: "Serviço" },
        { key: "profissional_nome", label: "Profissional" },
        { key: "status", label: "Status" },
        { key: "valor", label: "Valor do serviço" },
        { key: "forma_pagamento", label: "Forma de pagamento" },
        { key: "sinal_pago", label: "Sinal pago" },
        { key: "gratuito", label: "Gratuito" },
        { key: "origem", label: "Origem" },
        { key: "notas", label: "Observações" },
        { key: "id", label: "ID" },
      ]);
    }

    case "financeiro": {
      const rows = d.financeiro.map((f) => ({
        ...f,
        profissional_nome: profs.get(f.profissional_id)?.nome ?? "",
        cliente_nome: (() => {
          const ag = d.agendamentos.find((a) => a.id === f.agendamento_id);
          return ag ? clientes.get(ag.cliente_id)?.nome ?? "" : "";
        })(),
      }));
      return toCSV(rows, [
        { key: "data", label: "Data" },
        { key: "tipo", label: "Tipo" },
        { key: "descricao", label: "Descrição" },
        { key: "categoria", label: "Categoria" },
        { key: "cliente_nome", label: "Cliente" },
        { key: "profissional_nome", label: "Profissional" },
        { key: "valor", label: "Valor" },
        { key: "id", label: "ID" },
      ]);
    }

    case "servicos":
      return toCSV(d.servicos, [
        { key: "nome", label: "Nome" },
        { key: "descricao", label: "Descrição" },
        { key: "duracao", label: "Duração (min)" },
        { key: "preco", label: "Preço" },
        { key: "ativo", label: "Ativo" },
        { key: "id", label: "ID" },
      ]);

    case "estoque":
      return toCSV(d.estoque, [
        { key: "nome", label: "Produto" },
        { key: "marca", label: "Marca" },
        { key: "quantidade", label: "Quantidade" },
        { key: "quantidade_minima", label: "Quantidade mínima" },
        { key: "unidade", label: "Unidade" },
        { key: "preco_custo", label: "Preço de custo" },
        { key: "fornecedor", label: "Fornecedor" },
        { key: "id", label: "ID" },
      ]);

    case "fichas": {
      const rows = d.fichas.map((f) => ({
        ...f,
        cliente_nome: clientes.get(f.cliente_id)?.nome ?? "",
      }));
      return toCSV(rows, [
        { key: "cliente_nome", label: "Cliente" },
        { key: "created_at", label: "Criada em" },
        { key: "updated_at", label: "Atualizada em" },
        { key: "historico", label: "Histórico" },
        { key: "restricoes", label: "Restrições" },
        { key: "observacoes", label: "Observações" },
        { key: "procedimentos", label: "Procedimentos" },
        { key: "consentimentos", label: "Consentimentos" },
        { key: "consent_signed_at", label: "Consentimento assinado em" },
        { key: "fotos_urls", label: "Fotos (links)" },
        { key: "anexos_urls", label: "Anexos (links)" },
        { key: "id", label: "ID" },
      ]);
    }
  }
}

export function buildBackupJSON(d: AccountData): string {
  return JSON.stringify(
    {
      app: "FinBeauty",
      versao_export: 1,
      exportado_em: new Date().toISOString(),
      dados: d,
    },
    null,
    2,
  );
}
