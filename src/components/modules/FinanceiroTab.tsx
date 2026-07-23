import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceiro, useAgendamentos, useProfissionais, useInvalidate } from "@/hooks/queries";
import { CurrencyInputBRL } from "@/components/ui/currency-input";
import {
  DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Plus, Pencil, Trash2,
  Download, Search, ArrowUp, ArrowDown, Calendar as CalIcon, Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend, Line, ComposedChart,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { localDateStr, parseDateStr, formatBR, addDays } from "@/lib/dateUtils";
import { matchAllTokens } from "@/lib/searchUtils";

interface Transacao {
  id: string;
  tipo: string;
  descricao: string | null;
  valor: number;
  data: string;
  categoria: string | null;
  user_id: string;
  agendamento_id?: string | null;
  profissional_id?: string | null;
}
interface AgRow {
  id: string;
  data: string;
  status: string | null;
  cliente_id?: string | null;
  servico_id?: string | null;
  profissional_id?: string | null;
  clientes?: { nome: string } | null;
  servicos?: { nome: string } | null;
}
interface ProfRef { id: string; nome: string; }

type PeriodKey = "hoje" | "7d" | "mes" | "mesAnterior" | "custom";

function periodRange(p: PeriodKey, custom: { start: string; end: string }): { start: string; end: string } {
  const today = new Date();
  if (p === "hoje") {
    const s = localDateStr(today);
    return { start: s, end: s };
  }
  if (p === "7d") {
    return { start: localDateStr(addDays(today, -6)), end: localDateStr(today) };
  }
  if (p === "mes") {
    const s = new Date(today.getFullYear(), today.getMonth(), 1);
    const e = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return { start: localDateStr(s), end: localDateStr(e) };
  }
  if (p === "mesAnterior") {
    const s = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const e = new Date(today.getFullYear(), today.getMonth(), 0);
    return { start: localDateStr(s), end: localDateStr(e) };
  }
  return { start: custom.start || localDateStr(today), end: custom.end || localDateStr(today) };
}

function previousRange(start: string, end: string): { start: string; end: string } {
  const s = parseDateStr(start);
  const e = parseDateStr(end);
  const days = Math.round((e.getTime() - s.getTime()) / 86400000) + 1;
  const ps = addDays(s, -days);
  const pe = addDays(s, -1);
  return { start: localDateStr(ps), end: localDateStr(pe) };
}

const CHART_COLORS = ["hsl(142,71%,45%)", "hsl(0,76%,52%)", "hsl(217,91%,60%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)", "hsl(195,80%,45%)", "hsl(330,70%,55%)"];

export default function FinanceiroTab() {
  const { user, isDemo } = useAuth();
  const invalidate = useInvalidate();

  // Compartilhado via cache. Mesma queryKey usada pelo Dashboard.
  const { data: txRaw = [], isLoading: lT } = useFinanceiro();
  const { data: apptsRaw = [], isLoading: lA } = useAgendamentos();
  const { data: profsRaw = [], isLoading: lP } = useProfissionais();
  const transactions = txRaw as Transacao[];
  const appts = apptsRaw as unknown as AgRow[];
  const profissionais = profsRaw as ProfRef[];
  const loading = lT || lA || lP;
  const fetchAll = () => invalidate(["financeiro", "agendamentos", "profissionais"]);

  const [period, setPeriod] = useState<PeriodKey>("mes");
  const [custom, setCustom] = useState({ start: "", end: "" });

  // Tabela
  const [tableType, setTableType] = useState<"todos" | "receita" | "despesa">("todos");
  const [tableCat, setTableCat] = useState<string>("todas");
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState<"dataDesc" | "dataAsc" | "valorDesc" | "valorAsc">("dataDesc");
  const [tablePage, setTablePage] = useState(1);
  const pageSize = 20;

  // Dialogs
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState<"receita" | "despesa">("despesa");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState(localDateStr());
  const [newCategory, setNewCategory] = useState("");
  const [editing, setEditing] = useState<Transacao | null>(null);
  const [deleting, setDeleting] = useState<Transacao | null>(null);


  const range = useMemo(() => periodRange(period, custom), [period, custom]);
  const prevRange = useMemo(() => previousRange(range.start, range.end), [range]);

  const inRange = (d: string, r: { start: string; end: string }) => d >= r.start && d <= r.end;

  const filtered = useMemo(() => transactions.filter(t => inRange(t.data, range)), [transactions, range]);
  const prevFiltered = useMemo(() => transactions.filter(t => inRange(t.data, prevRange)), [transactions, prevRange]);

  const totalReceita = filtered.filter(t => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesa = filtered.filter(t => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const lucro = totalReceita - totalDespesa;
  const receitasCount = filtered.filter(t => t.tipo === "receita").length;
  const ticketMedio = receitasCount ? totalReceita / receitasCount : 0;
  const atendimentos = appts.filter(a => inRange(a.data, range) && a.status === "concluido").length;

  const prevReceita = prevFiltered.filter(t => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const prevDespesa = prevFiltered.filter(t => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const prevLucro = prevReceita - prevDespesa;
  const prevReceitasCount = prevFiltered.filter(t => t.tipo === "receita").length;
  const prevTicket = prevReceitasCount ? prevReceita / prevReceitasCount : 0;

  const pctTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr === 0 ? 0 : 100;
    return ((curr - prev) / Math.abs(prev)) * 100;
  };

  // Série diária para barras
  const dailySeries = useMemo(() => {
    const map = new Map<string, { date: string; receita: number; despesa: number; lucro: number }>();
    let cursor = parseDateStr(range.start);
    const end = parseDateStr(range.end);
    while (cursor <= end) {
      const k = localDateStr(cursor);
      map.set(k, { date: k, receita: 0, despesa: 0, lucro: 0 });
      cursor = addDays(cursor, 1);
    }
    filtered.forEach(t => {
      const row = map.get(t.data);
      if (!row) return;
      if (t.tipo === "receita") row.receita += Number(t.valor);
      else if (t.tipo === "despesa") row.despesa += Number(t.valor);
      row.lucro = row.receita - row.despesa;
    });
    return Array.from(map.values()).map(r => ({ ...r, label: formatBR(r.date).slice(0, 5) }));
  }, [filtered, range]);

  // Despesas por categoria
  const despPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(t => t.tipo === "despesa").forEach(t => {
      const k = t.categoria || "Sem categoria";
      map.set(k, (map.get(k) || 0) + Number(t.valor));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  // Categorias para filtro
  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.categoria) set.add(t.categoria); });
    return Array.from(set).sort();
  }, [transactions]);

  // Tabela
  const tableData = useMemo(() => {
    let arr = filtered.filter(t => {
      if (tableType !== "todos" && t.tipo !== tableType) return false;
      if (tableCat !== "todas" && (t.categoria || "Sem categoria") !== tableCat) return false;
      if (!matchAllTokens(tableSearch, [t.descricao, t.categoria])) return false;
      return true;
    });
    if (tableSort === "dataDesc") arr = [...arr].sort((a, b) => b.data.localeCompare(a.data));
    if (tableSort === "dataAsc") arr = [...arr].sort((a, b) => a.data.localeCompare(b.data));
    if (tableSort === "valorDesc") arr = [...arr].sort((a, b) => Number(b.valor) - Number(a.valor));
    if (tableSort === "valorAsc") arr = [...arr].sort((a, b) => Number(a.valor) - Number(b.valor));
    return arr;
  }, [filtered, tableType, tableCat, tableSearch, tableSort]);
  const totalPages = Math.max(1, Math.ceil(tableData.length / pageSize));
  const pageData = tableData.slice((tablePage - 1) * pageSize, tablePage * pageSize);
  useEffect(() => { setTablePage(1); }, [tableType, tableCat, tableSearch, tableSort, period, custom]);

  // Últimos 6 meses
  const last6Months = useMemo(() => {
    const out: Array<{ label: string; receita: number; despesa: number; lucro: number; margem: number }> = [];
    const today = new Date();
    for (let i = 5; i >= 0; i--) {
      const ref = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const s = localDateStr(ref);
      const e = localDateStr(new Date(ref.getFullYear(), ref.getMonth() + 1, 0));
      const tx = transactions.filter(t => t.data >= s && t.data <= e);
      const r = tx.filter(t => t.tipo === "receita").reduce((acc, t) => acc + Number(t.valor), 0);
      const d = tx.filter(t => t.tipo === "despesa").reduce((acc, t) => acc + Number(t.valor), 0);
      const l = r - d;
      out.push({
        label: ref.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" }).replace(".", ""),
        receita: r, despesa: d, lucro: l, margem: r > 0 ? (l / r) * 100 : 0,
      });
    }
    return out;
  }, [transactions]);

  const apptMap = useMemo(() => {
    const m = new Map<string, AgRow>();
    appts.forEach(a => m.set(a.id, a));
    return m;
  }, [appts]);
  const profMap = useMemo(() => {
    const m = new Map<string, string>();
    profissionais.forEach(p => m.set(p.id, p.nome));
    return m;
  }, [profissionais]);

  /** Returns the meta (cliente/servico/profissional/descrição) for a transaction row */
  const enrich = (t: Transacao) => {
    const ag = t.agendamento_id ? apptMap.get(t.agendamento_id) : undefined;
    const cliente = ag?.clientes?.nome || "";
    const servico = ag?.servicos?.nome || "";
    const profId = t.profissional_id || ag?.profissional_id || null;
    const profissional = profId ? (profMap.get(profId) || "") : "";
    // Fallback: if no agendamento, descricao often contains "Serviço — Cliente" — keep raw descricao for manual entries.
    return { cliente, servico, profissional, descricao: t.descricao || "" };
  };

  const exportCSV = () => {
    const rows = [["Data", "Tipo", "Serviço/Procedimento", "Cliente", "Profissional", "Categoria", "Descrição", "Valor"]];
    tableData.forEach(t => {
      const m = enrich(t);
      rows.push([
        t.data,
        t.tipo,
        m.servico,
        m.cliente,
        m.profissional,
        t.categoria || "",
        m.descricao,
        String(t.valor).replace(".", ","),
      ]);
    });
    const csv = rows.map(r => r.map(c => `"${(c || "").toString().replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financeiro_${range.start}_${range.end}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const addTransaction = async () => {
    if (!newDesc || !newAmount || !newDate) { toast.error("Preencha todos os campos"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setDialogOpen(false); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("financeiro").insert({
      user_id: user.id, tipo: newType, descricao: newDesc, valor: parseFloat(newAmount), data: newDate, categoria: newCategory || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Transação salva!");
    setNewDesc(""); setNewAmount(""); setNewDate(localDateStr()); setNewCategory("");
    setDialogOpen(false);
    fetchAll();
  };

  const saveEdit = async () => {
    if (!editing) return;
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setEditing(null); return; }
    if (editing.agendamento_id) { toast.error("Este lançamento veio de um agendamento. Edite pelo agendamento."); return; }
    setSaving(true);
    const { error } = await supabase.from("financeiro").update({
      tipo: editing.tipo, descricao: editing.descricao, valor: Number(editing.valor) || 0,
      data: editing.data, categoria: editing.categoria,
    }).eq("id", editing.id);
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Lançamento atualizado!");
    setEditing(null);
    fetchAll();
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setDeleting(null); return; }
    if (deleting.agendamento_id) { toast.error("Lançamento vinculado a um agendamento — exclua o agendamento."); setDeleting(null); return; }
    const { error } = await supabase.from("financeiro").delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Lançamento excluído.");
    setDeleting(null);
    fetchAll();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando financeiro...</p></div>;

  const TrendChip = ({ curr, prev, invert = false }: { curr: number; prev: number; invert?: boolean }) => {
    const pct = pctTrend(curr, prev);
    if (!isFinite(pct) || (curr === 0 && prev === 0)) return null;
    const positive = invert ? pct < 0 : pct > 0;
    const Icon = pct >= 0 ? ArrowUp : ArrowDown;
    return (
      <span className={cn("inline-flex items-center text-[10px] gap-0.5", positive ? "text-success" : "text-destructive")}>
        <Icon className="w-3 h-3" />{Math.abs(pct).toFixed(0)}%
      </span>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h2>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportCSV}>
            <Download className="w-3.5 h-3.5" /> CSV
          </Button>
          <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setDialogOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Nova Entrada
          </Button>
        </div>
      </div>

      {/* Seletor de período */}
      <div className="flex items-center gap-2 flex-wrap">
        {([
          ["hoje", "Hoje"], ["7d", "7 dias"], ["mes", "Mês atual"],
          ["mesAnterior", "Mês anterior"], ["custom", "Personalizado"],
        ] as Array<[PeriodKey, string]>).map(([k, label]) => (
          <Button key={k} size="sm" variant={period === k ? "default" : "outline"}
            onClick={() => setPeriod(k)}
            className={cn("h-7 text-xs", period === k && "gradient-brand text-primary-foreground")}>
            <CalIcon className="w-3 h-3 mr-1" />{label}
          </Button>
        ))}
        {period === "custom" && (
          <div className="flex items-center gap-2">
            <Input type="date" value={custom.start} onChange={e => setCustom({ ...custom, start: e.target.value })} className="bg-secondary border-border h-7 text-xs w-36" />
            <span className="text-xs text-muted-foreground">até</span>
            <Input type="date" value={custom.end} onChange={e => setCustom({ ...custom, end: e.target.value })} className="bg-secondary border-border h-7 text-xs w-36" />
          </div>
        )}
        <span className="text-xs text-muted-foreground">{formatBR(range.start)} → {formatBR(range.end)}</span>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <TrendingUp className="w-4 h-4 text-success" />
            <TrendChip curr={totalReceita} prev={prevReceita} />
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Receita</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <TrendingDown className="w-4 h-4 text-destructive" />
            <TrendChip curr={totalDespesa} prev={prevDespesa} invert />
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">R$ {totalDespesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Despesas</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <DollarSign className="w-4 h-4 text-primary" />
            <TrendChip curr={lucro} prev={prevLucro} />
          </div>
          <p className={cn("text-sm sm:text-lg font-bold mt-1", lucro >= 0 ? "text-foreground" : "text-destructive")}>R$ {lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Lucro</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <div className="flex items-center justify-between">
            <ArrowUpDown className="w-4 h-4 text-info" />
            <TrendChip curr={ticketMedio} prev={prevTicket} />
          </div>
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">R$ {ticketMedio.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Ticket médio</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <Receipt className="w-4 h-4 text-primary" />
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">{receitasCount}</p>
          <p className="text-[10px] text-muted-foreground">Lançamentos receita</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <CalIcon className="w-4 h-4 text-success" />
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">{atendimentos}</p>
          <p className="text-[10px] text-muted-foreground">Atendimentos concluídos</p>
        </div>
      </div>

      {/* Gráfico principal */}
      <div className="bg-card rounded-xl p-3 sm:p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receita vs Despesa</h3>
        <ResponsiveContainer width="100%" height={240}>
          <ComposedChart data={dailySeries}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
            <XAxis dataKey="label" tick={{ fontSize: 10 }} />
            <YAxis tick={{ fontSize: 10 }} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: any, n: any) => [`R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`, n]} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar dataKey="receita" name="Receita" fill="hsl(142,71%,45%)" radius={[4, 4, 0, 0]} />
            <Bar dataKey="despesa" name="Despesa" fill="hsl(0,76%,52%)" radius={[4, 4, 0, 0]} />
            <Line dataKey="lucro" name="Lucro" stroke="hsl(217,91%,60%)" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Despesas por categoria */}
      {despPorCategoria.length > 0 && (
        <div className="bg-card rounded-xl p-3 sm:p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Despesas por categoria</h3>
          <div className="grid md:grid-cols-2 gap-4 items-center">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={despPorCategoria} cx="50%" cy="50%" innerRadius={40} outerRadius={75} dataKey="value" paddingAngle={2}>
                  {despPorCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
                  formatter={(v: any) => `R$ ${Number(v).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
              </PieChart>
            </ResponsiveContainer>
            <div className="space-y-1.5">
              {despPorCategoria.map((c, i) => {
                const pct = totalDespesa > 0 ? (c.value / totalDespesa) * 100 : 0;
                return (
                  <div key={c.name} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      <span className="text-foreground truncate">{c.name}</span>
                    </div>
                    <span className="text-muted-foreground whitespace-nowrap ml-2">R$ {c.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })} · {pct.toFixed(0)}%</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tabela unificada */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="p-3 flex flex-col sm:flex-row gap-2 sm:items-center border-b border-border">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar lançamento…" value={tableSearch} onChange={e => setTableSearch(e.target.value)} className="pl-9 bg-secondary border-border h-8 text-sm" />
          </div>
          <Select value={tableType} onValueChange={v => setTableType(v as any)}>
            <SelectTrigger className="w-full sm:w-32 bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todos">Todos</SelectItem>
              <SelectItem value="receita">Receitas</SelectItem>
              <SelectItem value="despesa">Despesas</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tableCat} onValueChange={setTableCat}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="todas">Todas categorias</SelectItem>
              {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={tableSort} onValueChange={v => setTableSort(v as any)}>
            <SelectTrigger className="w-full sm:w-40 bg-secondary border-border h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-card border-border">
              <SelectItem value="dataDesc">Data ↓</SelectItem>
              <SelectItem value="dataAsc">Data ↑</SelectItem>
              <SelectItem value="valorDesc">Valor ↓</SelectItem>
              <SelectItem value="valorAsc">Valor ↑</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Data</th>
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Serviço / Descrição</th>
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Cliente</th>
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden lg:table-cell">Profissional</th>
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden md:table-cell">Categoria</th>
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden xl:table-cell">Origem</th>
              <th className="text-right p-2.5 text-muted-foreground font-medium text-xs">Valor</th>
              <th className="p-2.5 w-[88px]" />
            </tr></thead>
            <tbody>
              {pageData.length === 0 && <tr><td colSpan={8} className="p-6 text-center text-muted-foreground text-sm">Nenhum lançamento.</td></tr>}
              {pageData.map(t => {
                const m = enrich(t);
                const primaryLabel = m.servico || t.descricao || "—";
                return (
                  <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-2.5 text-muted-foreground text-xs whitespace-nowrap">{formatBR(t.data)}</td>
                    <td className="p-2.5 text-foreground text-sm">
                      <div className="truncate max-w-[220px]">{primaryLabel}</div>
                      {m.cliente && <div className="sm:hidden text-[11px] text-muted-foreground truncate">{m.cliente}</div>}
                    </td>
                    <td className="p-2.5 text-foreground text-sm hidden sm:table-cell">{m.cliente || "—"}</td>
                    <td className="p-2.5 text-muted-foreground text-xs hidden lg:table-cell">{m.profissional || "—"}</td>
                    <td className="p-2.5 text-muted-foreground text-xs hidden md:table-cell">{t.categoria || "—"}</td>
                    <td className="p-2.5 hidden xl:table-cell">
                      <Badge variant="outline" className="text-[10px] h-5">{t.agendamento_id ? "Agendamento" : "Manual"}</Badge>
                    </td>
                    <td className={cn("p-2.5 text-right font-semibold text-sm whitespace-nowrap", t.tipo === "receita" ? "text-success" : "text-destructive")}>
                      {t.tipo === "receita" ? "+" : "-"}R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                    </td>
                    <td className="p-1.5 text-right whitespace-nowrap">
                      <Button size="icon" variant="ghost" className="h-8 w-8" disabled={!!t.agendamento_id} title={t.agendamento_id ? "Edite pelo agendamento" : "Editar"} onClick={() => setEditing({ ...t })}><Pencil className="w-3.5 h-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive hover:text-destructive" disabled={!!t.agendamento_id} onClick={() => setDeleting(t)}><Trash2 className="w-3.5 h-3.5" /></Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="p-2 flex items-center justify-between text-xs text-muted-foreground border-t border-border">
            <span>Página {tablePage} de {totalPages} · {tableData.length} lançamentos</span>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={tablePage === 1} onClick={() => setTablePage(p => Math.max(1, p - 1))}>Anterior</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={tablePage === totalPages} onClick={() => setTablePage(p => Math.min(totalPages, p + 1))}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Comparativo 6 meses */}
      <div className="bg-card rounded-xl p-3 sm:p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Últimos 6 meses</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-2 text-muted-foreground font-medium text-xs">Mês</th>
              <th className="text-right p-2 text-muted-foreground font-medium text-xs">Receita</th>
              <th className="text-right p-2 text-muted-foreground font-medium text-xs">Despesa</th>
              <th className="text-right p-2 text-muted-foreground font-medium text-xs">Lucro</th>
              <th className="text-right p-2 text-muted-foreground font-medium text-xs">Margem</th>
            </tr></thead>
            <tbody>
              {last6Months.map(m => (
                <tr key={m.label} className="border-b border-border/50">
                  <td className="p-2 text-foreground text-sm capitalize">{m.label}</td>
                  <td className="p-2 text-right text-success text-sm">R$ {m.receita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className="p-2 text-right text-destructive text-sm">R$ {m.despesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className={cn("p-2 text-right text-sm font-semibold", m.lucro >= 0 ? "text-foreground" : "text-destructive")}>R$ {m.lucro.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</td>
                  <td className={cn("p-2 text-right text-sm", m.margem >= 0 ? "text-muted-foreground" : "text-destructive")}>{m.margem.toFixed(0)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-muted-foreground text-xs">Tipo</Label>
              <Select value={newType} onValueChange={v => setNewType(v as any)}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border"><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Valor (R$)</Label>
              <CurrencyInputBRL
                value={newAmount ? parseFloat(newAmount) : 0}
                onValueChange={(v) => setNewAmount(String(v))}
                className="mt-1"
              />
            </div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Material, Fixas, Serviços" className="bg-secondary border-border mt-1" /></div>
            <Button onClick={addTransaction} disabled={saving} className="w-full gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Editar Lançamento</DialogTitle></DialogHeader>
          {editing && (
            <div className="space-y-3 mt-2">
              <div><Label className="text-muted-foreground text-xs">Tipo</Label>
                <Select value={editing.tipo} onValueChange={v => setEditing({ ...editing, tipo: v })}>
                  <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card border-border"><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
                </Select>
              </div>
              <div><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={editing.descricao || ""} onChange={e => setEditing({ ...editing, descricao: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Valor (R$)</Label>
                <CurrencyInputBRL
                  value={Number(editing.valor) || 0}
                  onValueChange={(v) => setEditing({ ...editing, valor: v })}
                  className="mt-1"
                />
              </div>
              <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={editing.data} onChange={e => setEditing({ ...editing, data: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={editing.categoria || ""} onChange={e => setEditing({ ...editing, categoria: e.target.value })} className="bg-secondary border-border mt-1" /></div>
              <Button onClick={saveEdit} disabled={saving} className="w-full gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar alterações"}</Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deleting} onOpenChange={(o) => !o && setDeleting(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Excluir lançamento?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
