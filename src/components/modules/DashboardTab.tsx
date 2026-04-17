import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoAgendamentos, demoClientes, demoServicos, demoEstoque, demoFinanceiro } from "@/data/demoData";
import { Calendar, DollarSign, AlertTriangle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

const statusColorMap: Record<string, string> = {
  confirmado: "bg-success/15 text-success",
  pendente: "bg-warning/15 text-warning",
  concluido: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/15 text-destructive",
};

function formatDateStr(d: Date) { return d.toISOString().slice(0, 10); }

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

const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

export default function DashboardTab() {
  const { user, profile, isDemo } = useAuth();
  const navigate = useNavigate();
  const [appointments, setAppointments] = useState<Appt[]>([]);
  const [monthRevenue, setMonthRevenue] = useState(0);
  const [lowStock, setLowStock] = useState<LowStock[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [selectedDayAppts, setSelectedDayAppts] = useState<Appt[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");

  // New appointment inline
  const [newOpen, setNewOpen] = useState(false);
  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [servicos, setServicos] = useState<ServicoOption[]>([]);
  const [newForm, setNewForm] = useState({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" });
  const [saving, setSaving] = useState(false);

  // Inline new client
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const todayStr = formatDateStr(new Date());

  const fetchDashboard = async () => {
    const now = new Date();
    const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-31`;

    if (isDemo) {
      setAppointments(demoAgendamentos.filter(a => a.data >= monthStart && a.data <= monthEnd) as Appt[]);
      setMonthRevenue(demoFinanceiro.filter(t => t.tipo === "receita" && t.data >= monthStart && t.data <= monthEnd).reduce((s, t) => s + t.valor, 0));
      setLowStock(demoEstoque.filter(p => (p.quantidade || 0) < (p.quantidade_minima || 0)) as LowStock[]);
      setClients(demoClientes.map(c => ({ id: c.id, nome: c.nome })));
      setServicos(demoServicos.map(s => ({ id: s.id, nome: s.nome, preco: s.preco })));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);

    const [aRes, fRes, sRes, cRes, svRes] = await Promise.all([
      supabase.from("agendamentos").select("id, data, horario, status, clientes(nome), servicos(nome, preco)").eq("user_id", user.id).gte("data", monthStart).lte("data", monthEnd).order("data").order("horario"),
      supabase.from("financeiro").select("valor").eq("user_id", user.id).eq("tipo", "receita").gte("data", monthStart).lte("data", monthEnd),
      supabase.from("estoque").select("id, nome, quantidade, quantidade_minima").eq("user_id", user.id),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id),
      supabase.from("servicos").select("id, nome, preco").eq("user_id", user.id).eq("ativo", true),
    ]);
    setAppointments((aRes.data as Appt[]) || []);
    setMonthRevenue((fRes.data || []).reduce((s: number, t: any) => s + (t.valor || 0), 0));
    setLowStock((sRes.data || []).filter((p: any) => (p.quantidade || 0) < (p.quantidade_minima || 0)));
    setClients(cRes.data || []);
    setServicos(svRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchDashboard(); }, [user, isDemo]);

  const todayAppts = appointments.filter(a => a.data === todayStr).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));

  const openDayModal = (date: Date) => {
    const ds = formatDateStr(date);
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
    <div key={a.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.status === "confirmado" ? "hsl(145,63%,42%)" : a.status === "pendente" ? "hsl(45,93%,47%)" : "hsl(0,0%,45%)" }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{a.clientes?.nome || "Sem cliente"}</p>
          <p className="text-xs text-muted-foreground truncate">{a.servicos?.nome || "—"}</p>
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

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><Calendar className="w-4 h-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{todayAppts.length}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Agenda hoje</p>
          </div>
        </div>
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><DollarSign className="w-4 h-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">R$ {monthRevenue.toLocaleString("pt-BR")}</p>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Receita do mês</p>
          </div>
        </div>
      </div>

      {/* Today appointments */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Agendamentos de Hoje</h3>
        </div>
        <div className="space-y-1.5">
          {todayAppts.length === 0 && (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm mb-3">Nenhum agendamento hoje.</p>
              <Button size="sm" className="gradient-brand text-primary-foreground text-xs" onClick={() => { setNewForm(f => ({ ...f, data: todayStr })); setNewOpen(true); }}>
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
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }}><ChevronLeft className="w-4 h-4" /></Button>
          <span className="text-sm font-medium text-foreground capitalize">{calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        <div className="grid grid-cols-7 gap-0.5">
          {weekDays.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
          {days.map((date, i) => {
            if (!date) return <div key={i} />;
            const ds = formatDateStr(date);
            const appts = appointments.filter(a => a.data === ds);
            const isToday = ds === todayStr;
            return (
              <button key={i} onClick={() => openDayModal(date)} className={cn("relative min-h-[36px] sm:min-h-[44px] rounded-md text-xs font-medium transition-colors flex flex-col items-center justify-start pt-1", isToday ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground", appts.length > 0 && !isToday && "text-foreground")}>
                {date.getDate()}
                {appts.length > 0 && <div className="flex gap-0.5 mt-0.5">{appts.slice(0, 3).map((_, j) => <div key={j} className="w-1 h-1 rounded-full bg-primary" />)}</div>}
              </button>
            );
          })}
        </div>
      </div>

      {/* Alerts */}
      {lowStock.length > 0 && (
        <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas</h3>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} onClick={() => navigate("/home_profissional?tab=Estoque")} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground truncate">{p.nome}</p><p className="text-xs text-muted-foreground">Estoque: {p.quantidade || 0} / Mín: {p.quantidade_minima || 0}</p></div>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex-shrink-0 ml-2">Baixo</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Day detail modal */}
      <Dialog open={!!selectedDayAppts} onOpenChange={() => setSelectedDayAppts(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Agendamentos — {selectedDayStr ? new Date(selectedDayStr + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {selectedDayAppts?.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento neste dia.</p>}
            {selectedDayAppts?.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p><Badge className={cn("border-0 text-[10px]", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge></div>
              </div>
            ))}
          </div>
          <Button onClick={() => { setSelectedDayAppts(null); setNewForm(f => ({ ...f, data: selectedDayStr })); setNewOpen(true); }} className="w-full gradient-brand text-primary-foreground mt-2">
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </DialogContent>
      </Dialog>

      {/* New Appointment popup (inline on Dashboard) */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">Cliente</Label>
                <Button size="sm" variant="ghost" className="text-primary text-xs h-6 px-1" onClick={() => setNewClientOpen(true)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Novo Cliente
                </Button>
              </div>
              <Select value={newForm.cliente_id} onValueChange={v => setNewForm({ ...newForm, cliente_id: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={newForm.data} onChange={e => setNewForm({ ...newForm, data: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Horário</Label><Input type="time" value={newForm.horario} onChange={e => setNewForm({ ...newForm, horario: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2">
              <Label className="text-muted-foreground text-xs">Serviço</Label>
              <Select value={newForm.servico_id} onValueChange={v => setNewForm({ ...newForm, servico_id: v })} onOpenChange={open => { if (open) handleServiceClick(); }}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - R$ {s.preco || 0}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Pagamento</Label>
              <Select value={newForm.forma_pagamento} onValueChange={v => setNewForm({ ...newForm, forma_pagamento: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input value={newForm.notas} onChange={e => setNewForm({ ...newForm, notas: e.target.value })} placeholder="Observações..." className="bg-secondary border-border mt-1" /></div>
          </div>
          <Button onClick={createAppt} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar"}</Button>
        </DialogContent>
      </Dialog>

      {/* Quick new client (nested) */}
      <Dialog open={newClientOpen} onOpenChange={setNewClientOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Cliente Rápido</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-muted-foreground text-xs">Nome</Label><Input value={newClientName} onChange={e => setNewClientName(e.target.value)} placeholder="Nome da cliente" className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Telefone</Label><Input value={newClientPhone} onChange={e => setNewClientPhone(e.target.value)} placeholder="(00) 00000-0000" className="bg-secondary border-border mt-1" /></div>
          </div>
          <Button onClick={createQuickClient} className="w-full mt-3 gradient-brand text-primary-foreground">Salvar Cliente</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
