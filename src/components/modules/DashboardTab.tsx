import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoAgendamentos, demoClientes, demoServicos, demoEstoque, demoFinanceiro } from "@/data/demoData";
import { Calendar, DollarSign, AlertTriangle, Plus, ChevronLeft, ChevronRight, UserCheck, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { localDateStr, monthBounds, getLast7Days, parseDateStr, addDays } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";

const statusColorMap: Record<string, string> = {
  confirmado: "bg-success/15 text-success",
  pendente: "bg-warning/15 text-warning",
  em_atendimento: "bg-info/15 text-info",
  concluido: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/15 text-destructive",
  no_show: "bg-destructive/30 text-destructive",
  bloqueio: "bg-secondary text-secondary-foreground",
};
const statusDotColor: Record<string, string> = {
  confirmado: "hsl(145,63%,42%)",
  pendente: "hsl(45,93%,47%)",
  em_atendimento: "hsl(210,80%,55%)",
  concluido: "hsl(0,0%,55%)",
  cancelado: "hsl(0,62%,50%)",
  no_show: "hsl(0,80%,30%)",
  bloqueio: "hsl(0,0%,30%)",
};

function getDaysInMonth(date: Date) {
  const year = date.getFullYear(); const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
}

interface Appt { id: string; data: string; horario: string; status: string | null; clientes?: { nome: string } | null; servicos?: { nome: string; preco: number | null } | null; }
interface LowStock { id: string; nome: string; quantidade: number | null; quantidade_minima: number | null; }
interface ClienteOption { id: string; nome: string; }
interface ServicoOption { id: string; nome: string; preco: number | null; }
interface Receita { data: string; valor: number; }

const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

export default function DashboardTab() {
  const { user, profile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [recentReceitas, setRecentReceitas] = useState<Receita[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDayAppts, setSelectedDayAppts] = useState<Appt[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");

  const [newOpen, setNewOpen] = useState(false);
  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [servicos, setServicos] = useState<ServicoOption[]>([]);
  const [newForm, setNewForm] = useState({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" });
  const [saving, setSaving] = useState(false);

  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const todayDateStr = localDateStr();

  const fetchDashboard = async () => {
    const { start, end } = monthBounds();
    const last7 = getLast7Days();
    const weekStart = last7[0];

    if (isDemo) {
      setAppointments(demoAgendamentos as Appt[]);
      setMonthRevenue(demoFinanceiro.filter(t => t.tipo === "receita" && t.data >= start && t.data <= end).reduce((s, t) => s + t.valor, 0));
      setLowStock(demoEstoque.filter(p => (p.quantidade || 0) < (p.quantidade_minima || 0)) as LowStock[]);
      setRecentReceitas(demoFinanceiro.filter(t => t.tipo === "receita" && t.data >= weekStart).map(t => ({ data: t.data, valor: t.valor })));
      // Follow-up: clientes ativos com último atendimento > follow_up_days
      const followDays = profile?.follow_up_days || 30;
      const cutoff = localDateStr(addDays(new Date(), -followDays));
      const lastByClient = new Map<string, string>();
      demoAgendamentos.filter(a => a.status === "concluido").forEach(a => {
        const prev = lastByClient.get(a.cliente_id);
        if (!prev || a.data > prev) lastByClient.set(a.cliente_id, a.data);
      });
      const futureByClient = new Set(demoAgendamentos.filter(a => a.data >= todayDateStr && a.status !== "cancelado").map(a => a.cliente_id));
      let count = 0;
      lastByClient.forEach((last, cid) => {
        if (last < cutoff && !futureByClient.has(cid)) count++;
      });
      setFollowUpCount(count);
      setClients(demoClientes.map(c => ({ id: c.id, nome: c.nome })));
      setServicos(demoServicos.map(s => ({ id: s.id, nome: s.nome, preco: s.preco })));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);

    const followDays = profile?.follow_up_days || 30;
    const cutoff = localDateStr(addDays(new Date(), -followDays));

    const [aRes, fRes, sRes, cRes, svRes, recRes, concluidosRes, futurosRes] = await Promise.all([
      supabase.from("agendamentos").select("id, data, horario, status, cliente_id, clientes(nome), servicos(nome, preco)").eq("user_id", user.id).order("data").order("horario"),
      supabase.from("financeiro").select("valor").eq("user_id", user.id).eq("tipo", "receita").gte("data", start).lte("data", end),
      supabase.from("estoque").select("id, nome, quantidade, quantidade_minima").eq("user_id", user.id),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id),
      supabase.from("servicos").select("id, nome, preco").eq("user_id", user.id).eq("ativo", true),
      supabase.from("financeiro").select("data, valor").eq("user_id", user.id).eq("tipo", "receita").gte("data", weekStart),
      supabase.from("agendamentos").select("cliente_id, data").eq("user_id", user.id).eq("status", "concluido"),
      supabase.from("agendamentos").select("cliente_id").eq("user_id", user.id).gte("data", todayDateStr).neq("status", "cancelado"),
    ]);

    setAppointments((aRes.data as Appt[]) || []);
    setMonthRevenue((fRes.data || []).reduce((s: number, t: any) => s + (Number(t.valor) || 0), 0));
    setLowStock((sRes.data || []).filter((p: any) => (p.quantidade || 0) < (p.quantidade_minima || 0)));
    setClients(cRes.data || []);
    setServicos(svRes.data || []);
    setRecentReceitas((recRes.data || []).map((r: any) => ({ data: r.data, valor: Number(r.valor) || 0 })));

    const lastByClient = new Map<string, string>();
    (concluidosRes.data || []).forEach((a: any) => {
      const prev = lastByClient.get(a.cliente_id);
      if (!prev || a.data > prev) lastByClient.set(a.cliente_id, a.data);
    });
    const futureSet = new Set((futurosRes.data || []).map((a: any) => a.cliente_id));
    let count = 0;
    lastByClient.forEach((last, cid) => {
      if (last < cutoff && !futureSet.has(cid)) count++;
    });
    setFollowUpCount(count);

    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); /* eslint-disable-next-line */ }, [user, isDemo]);

  const todayAppts = useMemo(
    () => appointments.filter(a => a.data === todayDateStr).sort((a, b) => (a.horario || "").localeCompare(b.horario || "")),
    [appointments, todayDateStr]
  );

  const chart7d = useMemo(() => {
    const last7 = getLast7Days();
    const totals = new Map(last7.map(d => [d, 0]));
    recentReceitas.forEach(r => {
      if (totals.has(r.data)) totals.set(r.data, (totals.get(r.data) || 0) + r.valor);
    });
    return last7.map(d => ({
      dia: parseDateStr(d).toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", ""),
      valor: totals.get(d) || 0,
    }));
  }, [recentReceitas]);

  const openDayModal = (date: Date) => {
    const ds = localDateStr(date);
    setSelectedDayStr(ds);
    setSelectedDayAppts(appointments.filter(a => a.data === ds).sort((a, b) => (a.horario || "").localeCompare(b.horario || "")));
  };

  const createAppt = async () => {
    if (!newForm.data || !newForm.horario) { toast.error("Data e horário são obrigatórios"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setNewOpen(false); setNewForm({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" }); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("agendamentos").insert({
      user_id: user.id, data: newForm.data, horario: newForm.horario,
      cliente_id: newForm.cliente_id || null, servico_id: newForm.servico_id || null,
      notas: newForm.notas || null, forma_pagamento: newForm.forma_pagamento || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao criar agendamento"); return; }
    toast.success("Agendamento criado!");
    setNewOpen(false);
    setNewForm({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" });
    fetchDashboard();
  };

  const createQuickClient = async () => {
    if (!newClientName.trim()) { toast.error("Nome é obrigatório"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setNewClientOpen(false); return; }
    if (!user) return;
    const { data, error } = await supabase.from("clientes").insert({ nome: newClientName, telefone: newClientPhone || null, user_id: user.id }).select("id, nome").single();
    if (error) { toast.error("Erro ao criar cliente"); return; }
    toast.success("Cliente criado!");
    setClients(prev => [...prev, data]);
    setNewForm(f => ({ ...f, cliente_id: data.id }));
    setNewClientOpen(false);
    setNewClientName(""); setNewClientPhone("");
  };

  const handleServiceClick = () => {
    if (servicos.length === 0) {
      toast.info("Nenhum serviço cadastrado. Cadastre um serviço primeiro.");
      navigate("/home_profissional?tab=Servicos");
      setNewOpen(false);
    }
  };

  const days = getDaysInMonth(calendarDate);
  const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

  const renderApptRow = (a: Appt) => (
    <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-h-[56px]">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: statusDotColor[a.status || "pendente"] }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{a.clientes?.nome || "Sem cliente"}</p>
          <p className="text-xs text-muted-foreground truncate">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p>
        <Badge className={cn("border-0 text-[10px] px-1.5 py-0", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando dashboard...</p></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Bem-vinda{profile?.nome ? `, ${profile.nome.split(" ")[0]}` : ""}! ✨</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Resumo do seu dia.</p>
      </div>

      {/* Cards: 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
        <button onClick={() => navigate("/home_profissional?tab=Agendamentos")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><Calendar className="w-4 h-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{todayAppts.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Agenda hoje</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Financeiro")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-success/10 flex-shrink-0"><DollarSign className="w-4 h-4 text-success" /></div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-foreground truncate">R$ {monthRevenue.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Receita do mês</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Estoque")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-warning/10 flex-shrink-0"><Package className="w-4 h-4 text-warning" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{lowStock.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Estoque baixo</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Clientes")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-info/10 flex-shrink-0"><UserCheck className="w-4 h-4 text-info" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{followUpCount}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Para retornar</p>
          </div>
        </button>
      </div>

      {/* Chart 7 days */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receita dos últimos 7 dias</h3>
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={chart7d}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="dia" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} width={40} />
            <Tooltip
              contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }}
              formatter={(v: any) => [`R$ ${Number(v).toLocaleString("pt-BR")}`, "Receita"]}
            />
            <Bar dataKey="valor" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Today appointments */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Agendamentos de Hoje</h3>
          <span className="text-[10px] text-muted-foreground">{parseDateStr(todayDateStr).toLocaleDateString("pt-BR", { day: "numeric", month: "long" })}</span>
        </div>
        <div className="space-y-1.5">
          {todayAppts.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">Nenhum agendamento hoje.</p>
              <Button size="sm" className="gradient-brand text-primary-foreground text-xs h-9 min-h-[44px] sm:min-h-[36px]" onClick={() => { setNewForm(f => ({ ...f, data: todayDateStr })); setNewOpen(true); }}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Novo Agendamento
              </Button>
            </div>
          )}
          {todayAppts.map(renderApptRow)}
        </div>
      </div>

      {/* Calendar */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-foreground capitalize">{calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
          <Button size="icon" variant="ghost" className="h-9 w-9" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map((d, i) => <div key={i} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            const ds = localDateStr(date);
            const appts = appointments.filter(a => a.data === ds);
            const isToday = ds === todayDateStr;
            // Group dot colors by status
            const dotStatuses = Array.from(new Set(appts.map(a => a.status || "pendente"))).slice(0, 3);
            return (
              <button
                key={i}
                onClick={() => openDayModal(date)}
                className={cn(
                  "relative min-h-[40px] sm:min-h-[44px] rounded-md text-xs font-medium transition-colors flex flex-col items-center justify-start pt-1",
                  isToday ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground",
                  appts.length > 0 && !isToday && "text-foreground"
                )}
              >
                {date.getDate()}
                {appts.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dotStatuses.map((st, j) => (
                      <div key={j} className="w-1 h-1 rounded-full" style={{ background: statusDotColor[st] }} />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas de Estoque</h3>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} onClick={() => navigate("/home_profissional?tab=Estoque")} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors min-h-[56px]">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{p.nome}</p><p className="text-xs text-muted-foreground">Estoque: {p.quantidade || 0} / Mín: {p.quantidade_minima || 0}</p></div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex-shrink-0 ml-2">Baixo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day detail modal */}
      <Dialog open={!!selectedDayAppts} onOpenChange={() => setSelectedDayAppts(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Agendamentos — {selectedDayStr ? parseDateStr(selectedDayStr).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectedDayAppts?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento neste dia.</p>}
            {selectedDayAppts?.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 min-h-[56px]">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p><Badge className={cn("border-0 text-[10px]", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge></div>
              </div>
            ))}
          </div>
          <Button onClick={() => { setSelectedDayAppts(null); setNewForm(f => ({ ...f, data: selectedDayStr })); setNewOpen(true); }} className="w-full gradient-brand text-primary-foreground mt-2 min-h-[44px]">
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </DialogContent>
      </Dialog>

      {/* New appointment dialog */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-card border-border w-full max-w-md max-h-[90vh] overflow-y-auto sm:rounded-lg sm:max-h-[85vh] sm:w-auto rounded-none h-screen sm:h-auto">
          <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">Cliente</Label>
                <Button size="sm" variant="ghost" className="text-primary text-xs h-7 px-2" onClick={() => setNewClientOpen(true)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Novo
                </Button>
              </div>
              <Select value={newForm.cliente_id} onValueChange={v => setNewForm({ ...newForm, cliente_id: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={newForm.data} onChange={e => setNewForm({ ...newForm, data: e.target.value })} className="bg-secondary border-border mt-1 min-h-[44px]" /></div>
            <div><Label className="text-muted-foreground text-xs">Horário</Label><Input type="time" value={newForm.horario} onChange={e => setNewForm({ ...newForm, horario: e.target.value })} className="bg-secondary border-border mt-1 min-h-[44px]" /></div>
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">Serviço</Label>
              <Select value={newForm.servico_id} onValueChange={v => setNewForm({ ...newForm, servico_id: v })} onOpenChange={open => { if (open) handleServiceClick(); }}>
                <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - R$ {s.preco || 0}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Pagamento</Label>
              <Select value={newForm.forma_pagamento} onValueChange={v => setNewForm({ ...newForm, forma_pagamento: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input value={newForm.notas} onChange={e => setNewForm({ ...newForm, notas: e.target.value })} placeholder="Observações..." className="bg-secondary border-border mt-1 min-h-[44px]" /></div>
          </div>
          <Button onClick={createAppt} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground min-h-[44px]">{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogContent>
      </Dialog>

      {/* Quick new client */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Cliente Rápido</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-muted-foreground text-xs">Nome</Label><Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome da cliente" className="bg-secondary border-border mt-1 min-h-[44px]" /></div>
            <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1 min-h-[44px]" /></div>
          </div>
          <Button onClick={createQuickClient} className="w-full mt-3 gradient-brand text-primary-foreground min-h-[44px]">Salvar Cliente</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
