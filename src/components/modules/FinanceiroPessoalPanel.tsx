import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useFinanceiroPessoal, useInvalidate } from "@/hooks/queries";
import { CurrencyInputBRL } from "@/components/ui/currency-input";
import {
  TrendingUp, TrendingDown, Wallet, Plus, Pencil, Trash2,
  Download, Search, ArrowUp, ArrowDown, Calendar as CalIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { localDateStr, parseDateStr, formatBR, addDays } from "@/lib/dateUtils";
import { matchAllTokens } from "@/lib/searchUtils";

interface TxPessoal {
  id: string;
  tipo: "receita" | "despesa";
  descricao: string | null;
  valor: number;
  data: string;
  categoria: string | null;
  forma_pagamento: string | null;
  notas: string | null;
  user_id: string;
}

type PeriodKey = "hoje" | "7d" | "mes" | "mesAnterior" | "custom";

function periodRange(p: PeriodKey, custom: { start: string; end: string }) {
  const today = new Date();
  if (p === "hoje") { const s = localDateStr(today); return { start: s, end: s }; }
  if (p === "7d") return { start: localDateStr(addDays(today, -6)), end: localDateStr(today) };
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

const CHART_COLORS = ["hsl(142,71%,45%)", "hsl(0,76%,52%)", "hsl(217,91%,60%)", "hsl(38,92%,50%)", "hsl(270,70%,55%)", "hsl(195,80%,45%)", "hsl(330,70%,55%)"];

const CAT_RECEITA = ["Salário", "Investimentos", "Freelance", "Presente", "Outros"];
const CAT_DESPESA = ["Alimentação", "Moradia", "Transporte", "Saúde", "Educação", "Lazer", "Compras", "Contas", "Outros"];
const FORMAS = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro", "Boleto", "Transferência"];

const pageSize = 20;

export default function FinanceiroPessoalPanel() {
  const { user, isDemo } = useAuth();
  const invalidate = useInvalidate();

  const [period, setPeriod] = useState<PeriodKey>("mes");
  const [custom, setCustom] = useState({ start: "", end: "" });
  const range = useMemo(() => periodRange(period, custom), [period, custom]);

  const { data: raw = [], isLoading } = useFinanceiroPessoal();
  const transactions = raw as TxPessoal[];

  const [tableType, setTableType] = useState<"todos" | "receita" | "despesa">("todos");
  const [tableCat, setTableCat] = useState<string>("todas");
  const [tableSearch, setTableSearch] = useState("");
  const [tableSort, setTableSort] = useState<"dataDesc" | "dataAsc" | "valorDesc" | "valorAsc">("dataDesc");
  const [tablePage, setTablePage] = useState(1);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<{ id?: string; tipo: "receita" | "despesa"; descricao: string; valor: string; data: string; categoria: string; forma_pagamento: string; notas: string }>(
    { tipo: "despesa", descricao: "", valor: "", data: localDateStr(), categoria: "", forma_pagamento: "", notas: "" }
  );
  const [deleting, setDeleting] = useState<TxPessoal | null>(null);

  const inRange = (d: string) => d >= range.start && d <= range.end;
  const filtered = useMemo(() => transactions.filter(t => inRange(t.data)), [transactions, range]);
  const totalReceita = filtered.filter(t => t.tipo === "receita").reduce((s, t) => s + Number(t.valor), 0);
  const totalDespesa = filtered.filter(t => t.tipo === "despesa").reduce((s, t) => s + Number(t.valor), 0);
  const saldo = totalReceita - totalDespesa;

  const dailySeries = useMemo(() => {
    const map = new Map<string, { date: string; entradas: number; saidas: number }>();
    let cursor = parseDateStr(range.start);
    const end = parseDateStr(range.end);
    while (cursor <= end) {
      const k = localDateStr(cursor);
      map.set(k, { date: k, entradas: 0, saidas: 0 });
      cursor = addDays(cursor, 1);
    }
    filtered.forEach(t => {
      const row = map.get(t.data);
      if (!row) return;
      if (t.tipo === "receita") row.entradas += Number(t.valor);
      else row.saidas += Number(t.valor);
    });
    return Array.from(map.values()).map(r => ({ ...r, label: formatBR(r.date).slice(0, 5) }));
  }, [filtered, range]);

  const despPorCategoria = useMemo(() => {
    const map = new Map<string, number>();
    filtered.filter(t => t.tipo === "despesa").forEach(t => {
      const k = t.categoria || "Sem categoria";
      map.set(k, (map.get(k) || 0) + Number(t.valor));
    });
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filtered]);

  const allCategories = useMemo(() => {
    const set = new Set<string>();
    transactions.forEach(t => { if (t.categoria) set.add(t.categoria); });
    return Array.from(set).sort();
  }, [transactions]);

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

  const openNew = (tipo: "receita" | "despesa") => {
    setForm({ tipo, descricao: "", valor: "", data: localDateStr(), categoria: "", forma_pagamento: "", notas: "" });
    setDialogOpen(true);
  };
  const openEdit = (t: TxPessoal) => {
    setForm({ id: t.id, tipo: t.tipo, descricao: t.descricao || "", valor: String(t.valor), data: t.data, categoria: t.categoria || "", forma_pagamento: t.forma_pagamento || "", notas: t.notas || "" });
    setDialogOpen(true);
  };

  const save = async () => {
    const valor = Number(form.valor);
    if (!form.descricao.trim()) { toast.error("Informe a descrição"); return; }
    if (!Number.isFinite(valor) || valor <= 0) { toast.error("Informe um valor válido"); return; }
    if (!form.data) { toast.error("Informe a data"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setDialogOpen(false); return; }
    if (!user) return;
    setSaving(true);
    const payload = {
      tipo: form.tipo, descricao: form.descricao.trim(), valor,
      data: form.data, categoria: form.categoria || null,
      forma_pagamento: form.forma_pagamento || null, notas: form.notas || null,
    };
    const { error } = form.id
      ? await supabase.from("financeiro_pessoal" as any).update(payload).eq("id", form.id)
      : await supabase.from("financeiro_pessoal" as any).insert({ ...payload, user_id: user.id });
    setSaving(false);
    if (error) { toast.error(`Erro ao salvar: ${error.message}`); return; }
    toast.success(form.id ? "Lançamento atualizado!" : "Lançamento criado!");
    setDialogOpen(false);
    invalidate(["financeiroPessoal"]);
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setDeleting(null); return; }
    const { error } = await supabase.from("financeiro_pessoal" as any).delete().eq("id", deleting.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Lançamento excluído.");
    setDeleting(null);
    invalidate(["financeiroPessoal"]);
  };

  const exportCSV = () => {
    const rows = tableData.map(t => [
      t.data, t.tipo, t.descricao || "", t.categoria || "", t.forma_pagamento || "",
      Number(t.valor).toFixed(2).replace(".", ","),
    ]);
    const header = ["Data", "Tipo", "Descrição", "Categoria", "Forma", "Valor"];
    const csv = "\uFEFF" + [header, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financas-pessoais-${localDateStr()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando...</p></div>;

  const catOptions = form.tipo === "receita" ? CAT_RECEITA : CAT_DESPESA;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      {/* Aviso de contexto */}
      <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-foreground">
        <strong>Finanças pessoais</strong> — lançamentos separados do fluxo do studio.
        Nada daqui aparece nos relatórios do negócio.
      </div>

      {/* Ações */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Button size="sm" className="h-8 text-xs bg-emerald-600 hover:bg-emerald-700 text-white" onClick={() => openNew("receita")}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Entrada
          </Button>
          <Button size="sm" className="h-8 text-xs bg-rose-600 hover:bg-rose-700 text-white" onClick={() => openNew("despesa")}>
            <Plus className="w-3.5 h-3.5 mr-1" /> Saída
          </Button>
        </div>
        <Button size="sm" variant="outline" className="h-8 text-xs gap-1" onClick={exportCSV}>
          <Download className="w-3.5 h-3.5" /> CSV
        </Button>
      </div>

      {/* Período */}
      <div className="flex items-center gap-2 flex-wrap">
        {([["hoje", "Hoje"], ["7d", "7 dias"], ["mes", "Mês atual"], ["mesAnterior", "Mês anterior"], ["custom", "Personalizado"]] as Array<[PeriodKey, string]>).map(([k, label]) => (
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
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="p-3 rounded-xl bg-card border border-border">
          <TrendingUp className="w-4 h-4 text-success" />
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">R$ {totalReceita.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Entradas</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <TrendingDown className="w-4 h-4 text-destructive" />
          <p className="text-sm sm:text-lg font-bold text-foreground mt-1">R$ {totalDespesa.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Saídas</p>
        </div>
        <div className="p-3 rounded-xl bg-card border border-border">
          <Wallet className="w-4 h-4 text-primary" />
          <p className={cn("text-sm sm:text-lg font-bold mt-1", saldo >= 0 ? "text-foreground" : "text-destructive")}>R$ {saldo.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
          <p className="text-[10px] text-muted-foreground">Saldo</p>
        </div>
      </div>

      {/* Gráfico Entradas vs Saídas */}
      <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-2">Entradas vs Saídas por dia</h3>
        <div className="w-full h-56">
          <ResponsiveContainer>
            <BarChart data={dailySeries}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="entradas" name="Entradas" fill="hsl(142,71%,45%)" />
              <Bar dataKey="saidas" name="Saídas" fill="hsl(0,76%,52%)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Despesas por categoria */}
      {despPorCategoria.length > 0 && (
        <div className="p-3 sm:p-4 rounded-xl bg-card border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-2">Saídas por categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="w-full h-56">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={despPorCategoria} dataKey="value" nameKey="name" outerRadius={80}>
                    {despPorCategoria.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                  </Pie>
                  <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", fontSize: 12 }} formatter={(v: any) => `R$ ${Number(v).toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="space-y-1 text-xs">
              {despPorCategoria.map((c, i) => {
                const pct = totalDespesa > 0 ? (c.value / totalDespesa) * 100 : 0;
                return (
                  <li key={c.name} className="flex items-center justify-between border-b border-border/50 py-1">
                    <span className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: CHART_COLORS[i % CHART_COLORS.length] }} />
                      {c.name}
                    </span>
                    <span className="text-muted-foreground">R$ {c.value.toFixed(2)} · {pct.toFixed(0)}%</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      {/* Filtros da tabela */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex bg-secondary rounded-lg p-0.5">
          {(["todos", "receita", "despesa"] as const).map(t => (
            <button key={t} onClick={() => setTableType(t)}
              className={cn("px-3 py-1 rounded-md text-xs font-medium capitalize", tableType === t ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
              {t === "todos" ? "Todos" : t === "receita" ? "Entradas" : "Saídas"}
            </button>
          ))}
        </div>
        <Select value={tableCat} onValueChange={setTableCat}>
          <SelectTrigger className="bg-secondary border-border h-8 text-xs w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="todas">Todas categorias</SelectItem>
            {allCategories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <Input value={tableSearch} onChange={e => setTableSearch(e.target.value)} placeholder="Buscar..." className="bg-secondary border-border h-8 text-xs pl-7" />
        </div>
        <Select value={tableSort} onValueChange={(v: any) => setTableSort(v)}>
          <SelectTrigger className="bg-secondary border-border h-8 text-xs w-40"><SelectValue /></SelectTrigger>
          <SelectContent className="bg-card border-border">
            <SelectItem value="dataDesc">Data ↓</SelectItem>
            <SelectItem value="dataAsc">Data ↑</SelectItem>
            <SelectItem value="valorDesc">Valor ↓</SelectItem>
            <SelectItem value="valorAsc">Valor ↑</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabela */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-secondary/60">
              <tr>
                <th className="text-left p-2 font-medium text-muted-foreground">Data</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Descrição</th>
                <th className="text-left p-2 font-medium text-muted-foreground">Categoria</th>
                <th className="text-right p-2 font-medium text-muted-foreground">Valor</th>
                <th className="p-2" />
              </tr>
            </thead>
            <tbody>
              {pageData.length === 0 && (
                <tr><td colSpan={5} className="text-center p-6 text-muted-foreground">Nenhum lançamento pessoal no período.</td></tr>
              )}
              {pageData.map(t => (
                <tr key={t.id} className="border-t border-border">
                  <td className="p-2 whitespace-nowrap">{formatBR(t.data)}</td>
                  <td className="p-2">
                    <div className="flex items-center gap-2">
                      <Badge className={cn("border-0 text-[9px] px-1.5 py-0", t.tipo === "receita" ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600")}>
                        {t.tipo === "receita" ? "Entrada" : "Saída"}
                      </Badge>
                      <span className="text-foreground">{t.descricao || "-"}</span>
                    </div>
                  </td>
                  <td className="p-2 text-muted-foreground">{t.categoria || "-"}</td>
                  <td className={cn("p-2 text-right font-medium", t.tipo === "receita" ? "text-success" : "text-destructive")}>
                    {t.tipo === "receita" ? "+" : "-"} R$ {Number(t.valor).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2 whitespace-nowrap">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(t)}><Pencil className="w-3.5 h-3.5" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeleting(t)}><Trash2 className="w-3.5 h-3.5" /></Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-2 bg-secondary/40 text-xs">
            <span className="text-muted-foreground">Página {tablePage} de {totalPages}</span>
            <div className="flex gap-1">
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={tablePage === 1} onClick={() => setTablePage(p => p - 1)}>Anterior</Button>
              <Button size="sm" variant="outline" className="h-7 text-xs" disabled={tablePage === totalPages} onClick={() => setTablePage(p => p + 1)}>Próxima</Button>
            </div>
          </div>
        )}
      </div>

      {/* Dialog criar/editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {form.id ? "Editar" : "Novo"} {form.tipo === "receita" ? "entrada" : "saída"} pessoal
            </DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">Tipo</Label>
              <div className="flex bg-secondary rounded-lg p-0.5 mt-1">
                {(["receita", "despesa"] as const).map(t => (
                  <button key={t} type="button" onClick={() => setForm(f => ({ ...f, tipo: t, categoria: "" }))}
                    className={cn("flex-1 px-3 py-1.5 rounded-md text-xs font-medium", form.tipo === t ? (t === "receita" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white") : "text-muted-foreground")}>
                    {t === "receita" ? "Entrada" : "Saída"}
                  </button>
                ))}
              </div>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm({ ...form, descricao: e.target.value })} className="bg-secondary border-border mt-1 min-h-[40px]" placeholder="Ex: Supermercado" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Valor</Label>
              <CurrencyInputBRL value={form.valor} onChange={v => setForm({ ...form, valor: v })} className="bg-secondary border-border mt-1 min-h-[40px]" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Data</Label>
              <Input type="date" value={form.data} onChange={e => setForm({ ...form, data: e.target.value })} className="bg-secondary border-border mt-1 min-h-[40px]" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Categoria</Label>
              <Select value={form.categoria} onValueChange={v => setForm({ ...form, categoria: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 min-h-[40px]"><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {catOptions.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Forma pagamento</Label>
              <Select value={form.forma_pagamento} onValueChange={v => setForm({ ...form, forma_pagamento: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 min-h-[40px]"><SelectValue placeholder="Opcional" /></SelectTrigger>
                <SelectContent className="bg-card border-border">
                  {FORMAS.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} className="bg-secondary border-border mt-1" rows={2} />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground min-h-[44px]">
            {saving ? "Salvando..." : "Salvar"}
          </Button>
        </DialogContent>
      </Dialog>

      {/* Confirmar excluir */}
      <AlertDialog open={!!deleting} onOpenChange={o => !o && setDeleting(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir lançamento pessoal?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
