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
import { ClientCombobox } from "@/components/ui/ClientCombobox";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, CartesianGrid } from "recharts";
import { toast } from "sonner";
import AgendaGrid, { StatusLegend, StatusBadge, type AgendaView, type AgendaAppt, type AgendaBloqueio } from "@/components/agenda/AgendaGrid";

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

const apptViews: AgendaView[] = ["Diário", "Semanal", "Mensal"];

interface Appt extends AgendaAppt {}
interface Bloqueio extends AgendaBloqueio {}
interface LowStock { id: string; nome: string; quantidade: number | null; quantidade_minima: number | null; }
interface ClienteOption { id: string; nome: string; telefone?: string | null; }
interface ServicoOption { id: string; nome: string; preco: number | null; }
interface Receita { data: string; valor: number; }

const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

export default function DashboardTab() {
  const { user, profile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [bloqueios, setBloqueios] = useState<Bloqueio[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [recentReceitas, setRecentReceitas] = useState<Receita[]>([]);
  const [followUpCount, setFollowUpCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDayAppts, setSelectedDayAppts] = useState<Appt[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");
  const [apptView, setApptView] = useState<AgendaView>(() => {
    if (typeof window === "undefined") return "Semanal";
    const saved = window.localStorage.getItem("finbeauty.dashboard.view");
    return (saved === "Diário" || saved === "Semanal" || saved === "Mensal") ? saved : "Semanal";
  });
  const [apptCursor, setApptCursor] = useState(new Date());

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

    const [aRes, fRes, sRes, cRes, svRes, recRes, concluidosRes, futurosRes, bRes] = await Promise.all([
      supabase.from("agendamentos").select("id, data, horario, status, gratuito, forma_pagamento, cliente_id, clientes(nome), servicos(nome, preco, duracao)").eq("user_id", user.id).order("data").order("horario"),
      supabase.from("financeiro").select("valor").eq("user_id", user.id).eq("tipo", "receita").gte("data", start).lte("data", end),
      supabase.from("estoque").select("id, nome, quantidade, quantidade_minima").eq("user_id", user.id),
      supabase.from("clientes").select("id, nome, telefone").eq("user_id", user.id),
      supabase.from("servicos").select("id, nome, preco").eq("user_id", user.id).eq("ativo", true),
      supabase.from("financeiro").select("data, valor").eq("user_id", user.id).eq("tipo", "receita").gte("data", weekStart),
      supabase.from("agendamentos").select("cliente_id, data").eq("user_id", user.id).eq("status", "concluido"),
      supabase.from("agendamentos").select("cliente_id").eq("user_id", user.id).gte("data", todayDateStr).neq("status", "cancelado"),
      supabase.from("bloqueios_agenda").select("*").eq("user_id", user.id),
    ]);

    setBloqueios((bRes.data as Bloqueio[]) || []);

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
    <button
      key={a.id}
      onClick={() => navigate(`/home_profissional?tab=Agendamentos&open=${a.id}`)}
      className="w-full text-left flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors min-h-[56px]"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{a.clientes?.nome || "Sem cliente"}</p>
          <p className="text-xs text-muted-foreground truncate">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p>
        <StatusBadge status={a.status} gratuito={a.gratuito} />
      </div>
    </button>
  );

  const setView = (v: AgendaView) => {
    setApptView(v);
    if (typeof window !== "undefined") window.localStorage.setItem("finbeauty.dashboard.view", v);
  };

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
            <p className="text-xs sm:text-xs text-muted-foreground">Agenda hoje</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Financeiro")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-success/10 flex-shrink-0"><DollarSign className="w-4 h-4 text-success" /></div>
          <div className="min-w-0">
            <p className="text-base sm:text-2xl font-bold text-foreground truncate">R$ {monthRevenue.toLocaleString("pt-BR")}</p>
            <p className="text-xs sm:text-xs text-muted-foreground">Receita do mês</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Estoque")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-warning/10 flex-shrink-0"><Package className="w-4 h-4 text-warning" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{lowStock.length}</p>
            <p className="text-xs sm:text-xs text-muted-foreground">Estoque baixo</p>
          </div>
        </button>
        <button onClick={() => navigate("/home_profissional?tab=Clientes")} className="text-left flex items-center gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition min-h-[72px]">
          <div className="p-2 rounded-lg bg-info/10 flex-shrink-0"><UserCheck className="w-4 h-4 text-info" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{followUpCount}</p>
            <p className="text-xs sm:text-xs text-muted-foreground">Para retornar</p>
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

      {/* Appointments with period filter */}
      {(() => {
        const cursorStr = localDateStr(apptCursor);
        const navPeriod = (dir: number) => {
          const d = new Date(apptCursor);
          if (apptView === "Diário") d.setDate(d.getDate() + dir);
          else if (apptView === "Semanal") d.setDate(d.getDate() + dir * 7);
          else d.setMonth(d.getMonth() + dir);
          setApptCursor(d);
        };
        const headerLabel = apptView === "Mensal"
          ? apptCursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
          : apptCursor.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short" });

        const diarioAppts = appointments.filter(a => a.data === cursorStr).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
        const weekDates = getWeekDates(apptCursor);
        const weekDays7 = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
        const monthDays = getDaysInMonth(apptCursor);
        const monthShort = ["S", "T", "Q", "Q", "S", "S", "D"];

        return (
          <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
              <h3 className="text-sm font-semibold text-foreground">Agendamentos</h3>
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-0.5">
                  {apptViews.map(v => (
                    <button
                      key={v}
                      onClick={() => setApptView(v)}
                      className={cn(
                        "px-3 py-1.5 rounded-md text-xs font-medium transition-colors",
                        apptView === v ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {v}
                    </button>
                  ))}
                </div>
                <Button size="sm" variant="outline" className="border-border h-9 text-xs min-h-[36px]" onClick={() => navigate(`/home_profissional?tab=Agendamentos&bloquear=${cursorStr}`)}>
                  Bloquear
                </Button>
                <Button size="sm" className="gradient-brand text-primary-foreground h-9 text-xs min-h-[36px]" onClick={() => { setNewForm(f => ({ ...f, data: cursorStr })); setNewOpen(true); }}>
                  <Plus className="w-3.5 h-3.5 mr-1" /> Novo
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between mb-3">
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navPeriod(-1)}><ChevronLeft className="w-4 h-4" /></Button>
              <span className="text-xs sm:text-sm font-medium text-foreground capitalize text-center flex-1">{headerLabel}</span>
              <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => navPeriod(1)}><ChevronRight className="w-4 h-4" /></Button>
            </div>

            {apptView === "Diário" && (() => {
              const dayBloqs = bloqueios.filter(b => b.data === cursorStr);
              return (
                <div className="space-y-1.5">
                  {dayBloqs.map(b => (
                    <div key={b.id} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/40 text-xs" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground)/0.07) 6px 12px)" }}>
                      <span className="font-medium text-foreground">🚫 {b.motivo || "Bloqueio"}</span>
                      <span className="text-muted-foreground">{b.dia_todo ? "dia inteiro" : `${b.hora_inicio?.slice(0,5)} – ${b.hora_fim?.slice(0,5)}`}</span>
                    </div>
                  ))}
                  {diarioAppts.length === 0 && dayBloqs.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-muted-foreground text-sm mb-3">Nenhum agendamento neste dia.</p>
                      <Button size="sm" className="gradient-brand text-primary-foreground text-xs h-9" onClick={() => { setNewForm(f => ({ ...f, data: cursorStr })); setNewOpen(true); }}>
                        <Plus className="w-3.5 h-3.5 mr-1" /> Novo Agendamento
                      </Button>
                    </div>
                  ) : diarioAppts.map(renderApptRow)}
                </div>
              );
            })()}

            {apptView === "Semanal" && (() => {
              const startHour = 7;
              const endHour = 22;
              const hourHeight = 48; // px per hour
              const totalHeight = (endHour - startHour) * hourHeight;
              const hours = Array.from({ length: endHour - startHour }, (_, i) => startHour + i);
              const toMin = (h: string) => {
                const [hh, mm] = (h || "00:00").split(":").map(Number);
                return hh * 60 + (mm || 0);
              };
              return (
                <div className="overflow-x-auto">
                  <div className="min-w-[640px]">
                    {/* Header */}
                    <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))] border-b border-border">
                      <div />
                      {weekDates.map((date, i) => {
                        const isToday = localDateStr(date) === todayDateStr;
                        return (
                          <div key={i} className="text-center py-2 border-l border-border">
                            <p className="text-[10px] uppercase text-muted-foreground font-semibold">{weekDays7[i]}</p>
                            <p className={cn("text-sm font-semibold mt-0.5 inline-flex items-center justify-center w-7 h-7 rounded-full",
                              isToday ? "bg-primary text-primary-foreground" : "text-foreground")}>{date.getDate()}</p>
                          </div>
                        );
                      })}
                    </div>
                    {/* Body */}
                    <div className="grid grid-cols-[48px_repeat(7,minmax(0,1fr))]" style={{ height: totalHeight }}>
                      {/* Time column */}
                      <div className="relative" style={{ height: totalHeight }}>
                        {hours.map((h, idx) => (
                          <div
                            key={h}
                            className="absolute right-1 text-[10px] text-muted-foreground leading-none"
                            style={{ top: idx * hourHeight, transform: idx === 0 ? "none" : "translateY(-50%)" }}
                          >
                            {String(h).padStart(2, "0")}:00
                          </div>
                        ))}
                      </div>
                      {/* Day columns */}
                      {weekDates.map((date, i) => {
                        const ds = localDateStr(date);
                        const dayAppts = appointments.filter(a => a.data === ds);
                        const dayBloqs = bloqueios.filter(b => b.data === ds);
                        return (
                          <div
                            key={i}
                            onClick={() => openDayModal(date)}
                            className="relative border-l border-border cursor-pointer hover:bg-secondary/20"
                            style={{ height: totalHeight }}
                          >
                            {hours.map(h => (
                              <div key={h} style={{ height: hourHeight }} className="border-b border-border/50" />
                            ))}
                            {dayBloqs.map(b => {
                              const label = b.motivo || "Bloqueado";
                              if (b.dia_todo) {
                                return (
                                  <div key={b.id} className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none flex items-start justify-center pt-1" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground)/0.18) 6px 12px)" }} title={label}>
                                    <span className="text-[9px] font-semibold text-muted-foreground bg-card/80 px-1 rounded truncate max-w-[90%]">{label}</span>
                                  </div>
                                );
                              }
                              if (!b.hora_inicio || !b.hora_fim) return null;
                              const si = toMin(b.hora_inicio.slice(0,5));
                              const sf = toMin(b.hora_fim.slice(0,5));
                              const top = ((si - startHour * 60) / 60) * hourHeight;
                              const height = Math.max(8, ((sf - si) / 60) * hourHeight);
                              return (
                                <div key={b.id} className="absolute left-0 right-0 pointer-events-none px-1 py-0.5 overflow-hidden" style={{ top, height, backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground)/0.22) 6px 12px)" }} title={label}>
                                  <span className="text-[9px] font-semibold text-muted-foreground leading-tight truncate block">{label}</span>
                                </div>
                              );
                            })}
                            {dayAppts.map(a => {
                              const startMin = toMin(a.horario);
                              const dur = a.servicos?.duracao || 60;
                              const top = ((startMin - startHour * 60) / 60) * hourHeight;
                              const height = Math.max(18, (dur / 60) * hourHeight - 2);
                              if (top < 0 || top > totalHeight) return null;
                              const color = statusDotColor[a.status || "pendente"];
                              const endStr = `${String(Math.floor((startMin+dur)/60)).padStart(2,"0")}:${String((startMin+dur)%60).padStart(2,"0")}`;
                              return (
                                <button
                                  key={a.id}
                                  onClick={(e) => { e.stopPropagation(); navigate(`/home_profissional?tab=Agendamentos&open=${a.id}`); }}
                                  className="absolute left-1 right-1 rounded px-1 py-0.5 text-left overflow-hidden hover:opacity-90 transition"
                                  style={{ top, height, background: `${color}33`, borderLeft: `3px solid ${color}` }}
                                  title={`${a.horario?.slice(0,5)}–${endStr} · ${a.clientes?.nome || ""}${a.servicos?.nome ? ` · ${a.servicos.nome}` : ""}`}
                                >
                                  <p className="text-[10px] font-semibold text-foreground leading-tight truncate">
                                    {a.clientes?.nome || a.servicos?.nome || "Agendamento"}
                                  </p>
                                  <p className="text-[9px] text-muted-foreground leading-tight truncate">
                                    {a.horario?.slice(0,5)}{a.servicos?.duracao ? `–${endStr}` : ""}
                                  </p>
                                  {a.servicos?.nome && height >= 44 && (
                                    <p className="text-[9px] text-foreground/70 leading-tight truncate italic">{a.servicos.nome}</p>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}

            {apptView === "Mensal" && (
              <div className="grid grid-cols-7 gap-0.5">
                {monthShort.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
                {monthDays.map((date, i) => {
                  if (!date) return <div key={i} className="min-h-[90px] rounded-md bg-secondary/20" />;
                  const ds = localDateStr(date);
                  const appts = appointments.filter(a => a.data === ds).sort((a,b) => (a.horario||"").localeCompare(b.horario||""));
                  const dayBloqs = bloqueios.filter(b => b.data === ds);
                  const isToday = ds === todayDateStr;
                  return (
                    <button
                      key={i}
                      onClick={() => openDayModal(date)}
                      className={cn(
                        "min-h-[90px] rounded-md border border-border p-1 text-left transition-colors flex flex-col relative",
                        isToday ? "border-primary/50 bg-primary/5" : "hover:bg-secondary/50"
                      )}
                      style={dayBloqs.some(b => b.dia_todo) ? { backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground)/0.1) 6px 12px)" } : undefined}
                    >
                      <span className={cn(
                        "text-xs font-semibold mb-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full self-start",
                        isToday ? "bg-primary text-primary-foreground" : "text-foreground"
                      )}>{date.getDate()}</span>
                      <div className="flex-1 space-y-0.5 overflow-hidden">
                        {dayBloqs.map(b => (
                          <div key={b.id} className="text-[9px] px-1 py-0.5 rounded truncate leading-tight bg-muted/60 text-muted-foreground border-l-2 border-muted-foreground/40" title={b.motivo || "Bloqueado"}>
                            🚫 {b.motivo || (b.dia_todo ? "Bloqueado" : `${b.hora_inicio?.slice(0,5)}–${b.hora_fim?.slice(0,5)}`)}
                          </div>
                        ))}
                        {appts.slice(0, 3).map(a => {
                          const color = statusDotColor[a.status || "pendente"];
                          const cliente = a.clientes?.nome?.split(" ")[0] || "";
                          const serv = a.servicos?.nome || "";
                          return (
                            <div
                              key={a.id}
                              className="text-[9px] px-1 py-0.5 rounded truncate leading-tight"
                              style={{ background: `${color}33`, borderLeft: `2px solid ${color}`, color: "hsl(var(--foreground))" }}
                              title={`${a.horario?.slice(0,5)} ${a.clientes?.nome || ""}${serv ? ` · ${serv}` : ""}`}
                            >
                              {a.horario?.slice(0,5)} {cliente}{serv ? ` · ${serv}` : ""}
                            </div>
                          );
                        })}
                        {appts.length > 3 && <p className="text-[9px] text-muted-foreground">+{appts.length - 3} mais</p>}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })()}

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas de Estoque</h3>
          <div className="space-y-2">
            {lowStock.slice(0, 5).map(p => (
              <div key={p.id} onClick={() => navigate("/home_profissional?tab=Estoque")} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors min-h-[56px]">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{p.nome}</p><p className="text-xs text-muted-foreground">Estoque: {p.quantidade || 0} / Mín: {p.quantidade_minima || 0}</p></div>
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex-shrink-0 ml-2">Baixo</span>
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
            {bloqueios.filter(b => b.data === selectedDayStr).map(b => (
              <div key={b.id} className="flex items-center gap-2 p-3 rounded-lg bg-muted/40 border border-border min-h-[56px]" style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 6px, hsl(var(--muted-foreground)/0.07) 6px 12px)" }}>
                <span className="text-sm">🚫</span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{b.motivo || "Bloqueio"}</p>
                  <p className="text-xs text-muted-foreground">{b.dia_todo ? "Dia inteiro" : `${b.hora_inicio?.slice(0,5)} – ${b.hora_fim?.slice(0,5)}`}</p>
                </div>
              </div>
            ))}
            {selectedDayAppts?.length === 0 && bloqueios.filter(b => b.data === selectedDayStr).length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento neste dia.</p>}
            {selectedDayAppts?.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 min-h-[56px]">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{a.servicos?.nome || "—"} · {a.gratuito ? "R$ 0,00" : `R$ ${a.servicos?.preco || 0}`}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p><Badge className={cn("border-0 text-xs", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge></div>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-2 mt-2">
            <Button onClick={() => { setSelectedDayAppts(null); setNewForm(f => ({ ...f, data: selectedDayStr })); setNewOpen(true); }} className="flex-1 gradient-brand text-primary-foreground min-h-[44px]">
              <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
            </Button>
            <Button variant="outline" onClick={() => { setSelectedDayAppts(null); navigate(`/home_profissional?tab=Agendamentos&bloquear=${selectedDayStr}`); }} className="flex-1 border-border min-h-[44px]">
              Bloquear
            </Button>
          </div>
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
              <div className="mt-1">
                <ClientCombobox clients={clients} value={newForm.cliente_id} onChange={v => setNewForm({ ...newForm, cliente_id: v })} />
              </div>
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
