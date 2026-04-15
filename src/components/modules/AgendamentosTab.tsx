import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

interface Agendamento {
  id: string;
  data: string;
  horario: string;
  status: string | null;
  notas: string | null;
  origem: string | null;
  forma_pagamento: string | null;
  sinal_pago: boolean | null;
  cliente_id: string | null;
  servico_id: string | null;
  user_id: string;
  clientes?: { nome: string } | null;
  servicos?: { nome: string; preco: number | null } | null;
}

interface ClienteOption { id: string; nome: string; }
interface ServicoOption { id: string; nome: string; preco: number | null; }

const statusColorMap: Record<string, string> = {
  confirmado: "bg-success/15 text-success",
  pendente: "bg-warning/15 text-warning",
  concluido: "bg-muted text-muted-foreground",
  cancelado: "bg-destructive/15 text-destructive",
};

const views = ["Lista", "Diário", "Semanal", "Mensal"] as const;
const allStatuses = ["confirmado", "pendente", "concluido", "cancelado"];
const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

function formatDateStr(d: Date) { return d.toISOString().slice(0, 10); }

function getWeekDates(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
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
  const { user } = useAuth();
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
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dayModalAppts, setDayModalAppts] = useState<Agendamento[]>([]);
  const [newOpen, setNewOpen] = useState(false);
  const [newForm, setNewForm] = useState({ cliente_id: "", servico_id: "", data: "", horario: "", notas: "", forma_pagamento: "" });
  const [saving, setSaving] = useState(false);

  const fetchAll = async () => {
    if (!user) return;
    setLoading(true);
    const [aRes, cRes, sRes] = await Promise.all([
      supabase.from("agendamentos").select("*, clientes(nome), servicos(nome, preco)").eq("user_id", user.id).order("data", { ascending: true }).order("horario", { ascending: true }),
      supabase.from("clientes").select("id, nome").eq("user_id", user.id),
      supabase.from("servicos").select("id, nome, preco").eq("user_id", user.id).eq("ativo", true),
    ]);
    if (aRes.error) toast.error("Erro ao carregar agendamentos");
    setAppointments((aRes.data as Agendamento[]) || []);
    setClients(cRes.data || []);
    setServicos(sRes.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, [user]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "Diário") d.setDate(d.getDate() + dir);
    else if (view === "Semanal") d.setDate(d.getDate() + dir * 7);
    else if (view === "Mensal") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const openAppt = (a: Agendamento) => { setSelectedAppt(a); setEditStatus(a.status || "pendente"); setEditPayment(a.forma_pagamento || ""); setEditNotes(a.notas || ""); };
  const todayStr = formatDateStr(currentDate);

  const createAppt = async () => {
    if (!user || !newForm.data || !newForm.horario) { toast.error("Data e horário são obrigatórios"); return; }
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
    setSaving(true);
    const { error } = await supabase.from("agendamentos").update({ status: editStatus, forma_pagamento: editPayment || null, notas: editNotes || null }).eq("id", selectedAppt.id);
    setSaving(false);
    if (error) { toast.error("Erro ao atualizar"); return; }
    toast.success("Agendamento atualizado!");
    setSelectedAppt(null);
    fetchAll();
  };

  const openDayModal = (date: Date) => {
    const ds = formatDateStr(date);
    setDayModalDate(ds);
    setDayModalAppts(appointments.filter(a => a.data === ds));
  };

  const renderCard = (a: Agendamento) => (
    <div key={a.id} onClick={() => openAppt(a)} className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="text-center min-w-[40px]">
            <p className="text-base font-bold text-foreground">{a.horario?.slice(0, 5)}</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-foreground text-sm truncate">{a.clientes?.nome || "Sem cliente"}</p>
              {a.origem === "linkbio" && <Globe className="w-3 h-3 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{a.servicos?.nome || "Sem serviço"} · R$ {a.servicos?.preco || 0}</p>
          </div>
        </div>
        <Badge className={cn("border-0 text-[10px] px-1.5 py-0", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge>
      </div>
    </div>
  );

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando agendamentos...</p></div>;

  const renderDiario = () => {
    const appts = appointments.filter(a => a.data === todayStr);
    return <div className="space-y-2">{appts.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Nenhum agendamento.</p>}{appts.map(renderCard)}</div>;
  };

  const renderSemanal = () => {
    const weekDates = getWeekDates(currentDate);
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekDays.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
        {weekDates.map((date, i) => {
          const ds = formatDateStr(date); const appts = appointments.filter(a => a.data === ds);
          const isToday = ds === formatDateStr(new Date());
          return (
            <div key={i} onClick={() => openDayModal(date)} className={cn("min-h-[80px] sm:min-h-[100px] rounded-lg border border-border p-1 cursor-pointer hover:bg-secondary/50", isToday && "border-primary/50 bg-primary/5")}>
              <p className={cn("text-xs font-medium mb-0.5", isToday ? "text-primary" : "text-muted-foreground")}>{date.getDate()}</p>
              {appts.slice(0, 2).map(a => <div key={a.id} className="text-[9px] p-0.5 rounded bg-primary/10 text-foreground mb-0.5 truncate">{a.horario?.slice(0, 5)} {a.clientes?.nome?.split(" ")[0] || ""}</div>)}
              {appts.length > 2 && <p className="text-[9px] text-muted-foreground">+{appts.length - 2}</p>}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMensal = () => {
    const days = getDaysInMonth(currentDate);
    const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];
    const todayDs = formatDateStr(new Date());
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
        {days.map((date, i) => {
          if (!date) return <div key={i} />;
          const ds = formatDateStr(date); const appts = appointments.filter(a => a.data === ds);
          return (
            <button key={i} onClick={() => openDayModal(date)} className={cn("min-h-[36px] sm:min-h-[44px] rounded-md text-xs font-medium flex flex-col items-center justify-start pt-1 transition-colors", ds === todayDs ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground", appts.length > 0 && ds !== todayDs && "text-foreground")}>
              {date.getDate()}
              {appts.length > 0 && <div className="flex gap-0.5 mt-0.5">{appts.slice(0, 3).map((_, j) => <div key={j} className="w-1 h-1 rounded-full bg-primary" />)}</div>}
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{appointments.length} agendamentos</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-secondary rounded-lg p-0.5">
            {views.map(v => <button key={v} onClick={() => setView(v)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors", view === v ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v}</button>)}
          </div>
          <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setNewOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-xs sm:text-sm font-semibold text-foreground">
          {view === "Mensal" ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : currentDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {view === "Lista" && <div className="space-y-2">{appointments.length === 0 ? <p className="text-muted-foreground text-sm text-center py-6">Nenhum agendamento.</p> : appointments.map(renderCard)}</div>}
      {view === "Diário" && renderDiario()}
      {view === "Semanal" && renderSemanal()}
      {view === "Mensal" && renderMensal()}

      {/* New appointment */}
      <Dialog open={newOpen} onOpenChange={setNewOpen}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Cliente</Label>
              <Select value={newForm.cliente_id} onValueChange={v => setNewForm({ ...newForm, cliente_id: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{clients.map(c => <SelectItem key={c.id} value={c.id}>{c.nome}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={newForm.data} onChange={e => setNewForm({ ...newForm, data: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Horário</Label><Input type="time" value={newForm.horario} onChange={e => setNewForm({ ...newForm, horario: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Serviço</Label>
              <Select value={newForm.servico_id} onValueChange={v => setNewForm({ ...newForm, servico_id: v })}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent className="bg-card border-border">{servicos.map(s => <SelectItem key={s.id} value={s.id}>{s.nome} - R$ {s.preco || 0}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Pagamento</Label>
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

      {/* Detail/Edit modal */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selectedAppt && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Detalhes</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Cliente</p><p className="font-medium text-foreground text-sm">{selectedAppt.clientes?.nome || "—"}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Serviço</p><p className="font-medium text-foreground text-sm">{selectedAppt.servicos?.nome || "—"}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Data/Hora</p><p className="font-medium text-foreground text-sm">{new Date(selectedAppt.data + "T12:00").toLocaleDateString("pt-BR")} {selectedAppt.horario?.slice(0, 5)}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Valor</p><p className="font-medium text-foreground text-sm">R$ {selectedAppt.servicos?.preco || 0}</p></div>
                </div>
                <div><Label className="text-muted-foreground text-xs">Status</Label>
                  <Select value={editStatus} onValueChange={setEditStatus}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Pagamento</Label>
                  <Select value={editPayment} onValueChange={setEditPayment}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Observações</Label>
                  <Textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} className="bg-secondary border-border mt-1 min-h-[50px]" /></div>
                <Button onClick={updateAppt} disabled={saving} className="w-full gradient-brand text-primary-foreground text-xs">{saving ? "Salvando..." : "Salvar Alterações"}</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Day detail modal */}
      <Dialog open={!!dayModalDate} onOpenChange={() => setDayModalDate(null)}>
        <DialogContent className="max-w-md bg-card border-border max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {dayModalDate ? new Date(dayModalDate + "T12:00").toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" }) : ""}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {dayModalAppts.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento.</p>}
            {dayModalAppts.map(a => (
              <div key={a.id} onClick={() => { setDayModalDate(null); openAppt(a); }} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 cursor-pointer hover:bg-secondary">
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientes?.nome || "—"}</p><p className="text-xs text-muted-foreground">{a.servicos?.nome || "—"} · R$ {a.servicos?.preco || 0}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.horario?.slice(0, 5)}</p><Badge className={cn("border-0 text-[10px]", statusColorMap[a.status || "pendente"])}>{a.status || "pendente"}</Badge></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
