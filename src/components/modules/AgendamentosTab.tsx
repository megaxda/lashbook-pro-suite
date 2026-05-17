import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoAgendamentos, demoClientes, demoServicos } from "@/data/demoData";
import { Plus, ChevronLeft, ChevronRight, Globe, Ban, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { localDateStr, parseDateStr, addDays } from "@/lib/dateUtils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";

interface PagamentoItem { metodo: string; valor: number; }
interface Agendamento {
  id: string; data: string; horario: string; status: string | null; notas: string | null;
  origem: string | null; forma_pagamento: string | null; sinal_pago: boolean | null;
  cliente_id: string | null; servico_id: string | null; user_id: string;
  comprovante_url: string | null;
  gratuito?: boolean | null;
  pagamentos_detalhe?: PagamentoItem[] | null;
  clientes?: { nome: string } | null; servicos?: { nome: string; preco: number | null } | null;
}
interface Bloqueio { id: string; data: string; dia_todo: boolean; hora_inicio: string | null; hora_fim: string | null; motivo: string | null; }

interface ClienteOption { id: string; nome: string; }
interface ServicoOption { id: string; nome: string; preco: number | null; }

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

const views = ["Lista", "Diário", "Semanal", "Mensal"] as const;
const allStatuses = ["confirmado", "pendente", "em_atendimento", "concluido", "cancelado", "no_show", "bloqueio"];
const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

function getWeekDates(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date); monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => { const d = new Date(monday); d.setDate(monday.getDate() + i); return d; });
}

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

export default function AgendamentosTab() {
  const { user, isDemo } = useAuth();
  const nav = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [appointments, setAppointments] = useState<Agendamento[]>([]);
  const [clients, setClients] = useState<ClienteOption[]>([]);
  const [servicos, setServicos] = useState<ServicoOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<typeof views[number]>("Lista");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedAppt, setSelectedAppt] = useState<Agendamento | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [editData, setEditData] = useState("");
  const [editHorario, setEditHorario] = useState("");
  const [editClienteId, setEditClienteId] = useState("");
  const [editServicoId, setEditServicoId] = useState("");
  const [comprovanteUrl, setComprovanteUrl] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" });
  const [saving, setSaving] = useState(false);
  const [newClientOpen, setNewClientOpen] = useState(false);
  const [newClientName, setNewClientName] = useState("");
  const [newClientPhone, setNewClientPhone] = useState("");

  const fetchAll = async () => {
    if (isDemo) {
      setAppointments(demoAgendamentos as Agendamento[]);
      setClients(demoClientes.map(c => ({ id: c.id, nome: c.nome })));
      setServicos(demoServicos.map(s => ({ id: s.id, nome: s.nome, preco: s.preco })));
      setLoading(false);
      return;
    }
    if (!user) return;
    setLoading(true);
    const [aRes, cRes, sRes] = await Promise.all([
      supabase.from("agendamentos").select("*, clientes(nome), servicos(nome, preco)").eq("user_id", user.id).order("data", { ascending: true }).order("horario", { ascending: true }),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id),
      supabase.from("servicos").select("id, nome, preco").eq("user_id", user.id).eq("ativo", true),
    ]);
    if (aRes.error) toast.error("Erro ao carregar agendamentos");
    setAppointments(((aRes.data as any[]) || []) as Agendamento[]);
    setClients(cRes.data || []);
    setServicos(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); /* eslint-disable-next-line */ }, [user, isDemo]);

  // Auto-open appointment from ?open=ID (e.g., when navigating from dashboard)
  useEffect(() => {
    const openId = searchParams.get("open");
    if (!openId || appointments.length === 0) return;
    const target = appointments.find(a => a.id === openId);
    if (target) {
      openAppt(target);
      const next = new URLSearchParams(searchParams);
      next.delete("open");
      setSearchParams(next, { replace: true });
    }
    // eslint-disable-next-line
  }, [appointments, searchParams]);

  const demoBlock = () => { if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return true; } return false; };

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "Diário") d.setDate(d.getDate() + dir);
    else if (view === "Semanal") d.setDate(d.getDate() + dir * 7);
    else if (view === "Mensal") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const openAppt = async (a: Agendamento) => {
    setSelectedAppt(a);
    setEditStatus(a.status || "pendente");
    setEditPayment(a.forma_pagamento || "");
    setEditNotes(a.notas || "");
    setEditData(a.data);
    setEditHorario(a.horario?.slice(0, 5) || "");
    setEditClienteId(a.cliente_id || "");
    setEditServicoId(a.servico_id || "");
    setComprovanteUrl(null);
    if (a.comprovante_url && !isDemo) {
      const { data } = await supabase.storage.from("comprovantes").createSignedUrl(a.comprovante_url, 600);
      setComprovanteUrl(data?.signedUrl || null);
    }
  };
  const currentDateStr = localDateStr(currentDate);
  const todayStr = localDateStr();

  const createAppt = async () => {
    if (!newForm.data || !newForm.horario) { toast.error("Data e horário são obrigatórios"); return; }
    if (demoBlock()) { setNewOpen(false); setNewForm({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" }); return; }
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
    fetchAll();
  };

  const updateAppt = async () => {
    if (!selectedAppt) return;
    if (demoBlock()) { setSelectedAppt(null); return; }
    setSaving(true);
    const { error } = await supabase.from("agendamentos").update({
      status: editStatus,
      forma_pagamento: editPayment || null,
      notas: editNotes || null,
      data: editData,
      horario: editHorario,
      cliente_id: editClienteId || null,
      servico_id: editServicoId || null,
    }).eq("id", selectedAppt.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Agendamento atualizado!");
    setSelectedAppt(null);
    fetchAll();
  };

  const deleteAppt = async () => {
    if (!selectedAppt) return;
    if (demoBlock()) { setSelectedAppt(null); return; }
    if (!confirm("Excluir este agendamento?")) return;
    setDeleting(true);
    const { error } = await supabase.from("agendamentos").delete().eq("id", selectedAppt.id);
    setDeleting(false);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Agendamento excluído.");
    setSelectedAppt(null);
    fetchAll();
  };

  const createQuickClient = async () => {
    if (!newClientName.trim()) { toast.error("Nome é obrigatório"); return; }
    if (demoBlock()) { setNewClientOpen(false); return; }
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
      nav("/home_profissional?tab=Servicos");
      setNewOpen(false);
    }
  };

  const openDayModal = (date: Date) => setDayModalDate(localDateStr(date));

  const dayModalAppts = useMemo(
    () => dayModalDate ? appointments.filter(a => a.data === dayModalDate).sort((a, b) => (a.horario || "").localeCompare(b.horario || "")) : [],
    [dayModalDate, appointments]
  );

  const renderCard = (a: Agendamento) => (
    <div key={a.id} onClick={() => openAppt(a)} className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer min-h-[64px]">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="text-center min-w-[44px]">
            <p className="text-base font-bold text-foreground">{a.horario?.slice(0, 5)}</p>
            <p className="text-[9px] text-muted-foreground">{parseDateStr(a.data).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" })}</p>
          </div>
          <div className="w-px h-10 bg-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-foreground text-sm truncate">{a.clientes?.nome || "Sem cliente"}</p>
              {a.origem === "link_bio" && <Globe className="w-3 h-3 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{a.servicos?.nome || "Sem serviço"} · R$ {a.servicos?.preco || 0}</p>
          </div>
        </div>
        <Badge className={cn("border-0 text-xs px-1.5 py-0", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando agendamentos...</p></div>;

  const renderDiario = () => {
    const appts = appointments.filter(a => a.data === currentDateStr).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
    return (
      <div className="space-y-2">
        {appts.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Nenhum agendamento neste dia.</p>}
        {appts.map(renderCard)}
      </div>
    );
  };

  const renderSemanal = () => {
    const weekDates = getWeekDates(currentDate);
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekDays.map(d => <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
        {weekDates.map((date, i) => {
          const ds = localDateStr(date);
          const appts = appointments.filter(a => a.data === ds).sort((a, b) => (a.horario || "").localeCompare(b.horario || ""));
          const isToday = ds === todayStr;
          return (
            <div key={i} onClick={() => openDayModal(date)} className={cn("min-h-[100px] sm:min-h-[120px] rounded-lg border border-border p-1 cursor-pointer hover:bg-secondary/50", isToday && "border-primary/50 bg-primary/5")}>
              <p className={cn("text-xs font-medium mb-0.5", isToday ? "text-primary" : "text-muted-foreground")}>{date.getDate()}</p>
              {appts.slice(0, 3).map(a => (
                <div key={a.id} className="text-[9px] p-1 rounded mb-0.5 truncate" style={{ background: `${statusDotColor[a.status || "pendente"]}22`, color: "hsl(var(--foreground))" }}>
                  {a.horario?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0] || ""}
                </div>
              ))}
              {appts.length > 3 && <p className="text-[9px] text-muted-foreground">+{appts.length - 3}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMensal = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map((d, i) => <div key={i} className="text-center text-xs font-semibold text-muted-foreground py-1">{d}</div>)}
        {days.map((date, i) => {
          if (!date) return <div key={i} />;
          const ds = localDateStr(date);
          const appts = appointments.filter(a => a.data === ds);
          const isToday = ds === todayStr;
          const dotStatuses = Array.from(new Set(appts.map(a => a.status || "pendente"))).slice(0, 3);
          return (
            <button
              key={i}
              onClick={() => openDayModal(date)}
              className={cn(
                "min-h-[44px] sm:min-h-[56px] rounded-md text-xs font-medium flex flex-col items-center justify-start pt-1 transition-colors",
                isToday ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground",
                appts.length > 0 && !isToday && "text-foreground"
              )}
            >
              {date.getDate()}
              {appts.length > 0 && (
                <div className="flex gap-0.5 mt-0.5">
                  {dotStatuses.map((st, j) => <div key={j} className="w-1.5 h-1.5 rounded-full" style={{ background: statusDotColor[st] }} />)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    );
  };

  // Status legend
  const legend = [
    { label: "Confirmado", color: statusDotColor.confirmado },
    { label: "Pendente", color: statusDotColor.pendente },
    { label: "Em atend.", color: statusDotColor.em_atendimento },
    { label: "Concluído", color: statusDotColor.concluido },
    { label: "Cancelado", color: statusDotColor.cancelado },
  ];

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in pb-24 lg:pb-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{appointments.length} agendamentos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-secondary rounded-lg p-0.5 overflow-x-auto">
            {views.map(v => <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors min-h-[36px]", view === v ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v}</button>)}
          </div>
          {/* Hide desktop "Novo" — mobile uses FAB */}
          <Button size="sm" className="gradient-brand text-primary-foreground h-9 text-xs hidden sm:inline-flex min-h-[36px]" onClick={() => setNewOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-9 w-9 min-w-[36px]" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-xs sm:text-sm font-semibold text-foreground flex-1 text-center sm:text-left">
          {view === "Mensal" ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : currentDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-9 w-9 min-w-[36px]" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
        {legend.map(l => (
          <div key={l.label} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ background: l.color }} />
            {l.label}
          </div>
        ))}
      </div>

      {view === "Lista" && (
        <div className="space-y-2">
          {appointments.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">Nenhum agendamento.</p> : appointments.map(renderCard)}
        </div>
      )}
      {view === "Diário" && renderDiario()}
      {view === "Semanal" && renderSemanal()}
      {view === "Mensal" && renderMensal()}

      {/* FAB - Mobile */}
      <button
        onClick={() => setNewOpen(true)}
        className="sm:hidden fixed bottom-20 right-4 z-30 w-14 h-14 rounded-full gradient-brand text-primary-foreground shadow-lg glow-brand flex items-center justify-center hover:scale-105 transition-transform"
        aria-label="Novo agendamento"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* New appointment */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="bg-card border-border w-full max-w-md max-h-[90vh] overflow-y-auto sm:rounded-lg sm:w-auto sm:max-h-[85vh] rounded-none h-screen sm:h-auto">
          <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2">
              <div className="flex items-center justify-between">
                <Label className="text-muted-foreground text-xs">Cliente</Label>
                <Button size="sm" variant="ghost" className="text-primary text-xs h-7 px-2" onClick={() => setNewClientOpen(true)}>
                  <Plus className="w-3 h-3 mr-0.5" /> Novo Cliente
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
            <div><Label className="text-muted-foreground text-xs">Pagamento</Label>
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

      {/* Detail/Edit modal */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[90vh] overflow-y-auto">
          {selectedAppt && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Detalhes</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="col-span-2">
                    <Label className="text-muted-foreground text-xs">Cliente</Label>
                    <Select value={editClienteId} onValueChange={setEditClienteId}>
                      <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-2">
                    <Label className="text-muted-foreground text-xs">Serviço (valor)</Label>
                    <Select value={editServicoId} onValueChange={setEditServicoId}>
                      <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                      <SelectContent className="bg-card border-border">{servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} — R$ {s.preco || 0}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Data</Label>
                    <Input type="date" value={editData} onChange={e => setEditData(e.target.value)} className="bg-secondary border-border mt-1 min-h-[44px]" />
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Horário</Label>
                    <Input type="time" value={editHorario} onChange={e => setEditHorario(e.target.value)} className="bg-secondary border-border mt-1 min-h-[44px]" />
                  </div>
                </div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{allStatuses.map(s => <SelectItem key={s} value={s}>{s.replace("_", " ")}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Pagamento</Label>
                  <Select value={editPayment} onValueChange={setEditPayment}>
                    <SelectTrigger className="bg-secondary border-border mt-1 min-h-[44px]"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Observações</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="bg-secondary border-border mt-1 min-h-[60px]" /></div>
                {selectedAppt.comprovante_url && (
                  <div className="p-2.5 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground mb-1">Comprovante de pagamento</p>
                    {comprovanteUrl ? (
                      <a href={comprovanteUrl} target="_blank" rel="noreferrer" className="text-primary text-sm font-medium underline">Abrir comprovante enviado</a>
                    ) : (
                      <p className="text-xs text-muted-foreground">Carregando...</p>
                    )}
                  </div>
                )}
                <div className="flex gap-2">
                  <Button onClick={updateAppt} disabled={saving} className="flex-1 gradient-brand text-primary-foreground min-h-[44px]">{saving ? "Salvando..." : "Salvar Alterações"}</Button>
                  <Button onClick={deleteAppt} disabled={deleting} variant="outline" className="border-destructive/40 text-destructive hover:bg-destructive/10 min-h-[44px]">Excluir</Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Day detail modal */}
      <Dialog open={!!dayModalDate} onOpenChange={() => setDayModalDate(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {dayModalDate ? parseDateStr(dayModalDate).toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {dayModalAppts.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento.</p>}
            {dayModalAppts.map(a => (
              <div key={a.id} onClick={() => { setDayModalDate(null); openAppt(a); }} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary min-h-[56px]">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p><Badge className={cn("border-0 text-xs", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge></div>
              </div>
            ))}
          </div>
          <Button onClick={() => { const ds = dayModalDate; setDayModalDate(null); setNewForm(f => ({ ...f, data: ds || "" })); setNewOpen(true); }} className="w-full gradient-brand text-primary-foreground mt-2 min-h-[44px]">
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
