import { useState } from "react";
import { mockAppointments, mockServices, mockClients, Appointment } from "@/data/mockData";
import { Plus, ChevronLeft, ChevronRight, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

const statusColorMap: Record<string, string> = {
  Confirmado: "bg-success/15 text-success",
  Pendente: "bg-warning/15 text-warning",
  "Em atendimento": "bg-info/15 text-info",
  Concluído: "bg-muted text-muted-foreground",
  Cancelado: "bg-destructive/15 text-destructive",
  "No-show": "bg-destructive/20 text-destructive",
};

const legendItems = [
  { label: "Confirmado", color: "bg-success" },
  { label: "Pendente", color: "bg-warning" },
  { label: "Em atendimento", color: "bg-info" },
  { label: "Concluído", color: "bg-muted-foreground" },
  { label: "Cancelado", color: "bg-destructive" },
  { label: "No-show", color: "bg-destructive/80" },
];

const views = ["Lista", "Diário", "Semanal", "Mensal"] as const;
const allStatuses = ["Confirmado", "Pendente", "Em atendimento", "Concluído", "Cancelado", "No-show"] as const;
const paymentMethods = ["PIX", "Cartão Crédito", "Cartão Débito", "Dinheiro"];

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

function formatDateStr(d: Date) { return d.toISOString().slice(0, 10); }

export default function AgendamentosTab() {
  const [view, setView] = useState<typeof views[number]>("Lista");
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 11));
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editPayment, setEditPayment] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [dayModalDate, setDayModalDate] = useState<string | null>(null);
  const [dayModalAppts, setDayModalAppts] = useState<Appointment[]>([]);

  const navigate = (dir: number) => {
    const d = new Date(currentDate);
    if (view === "Diário") d.setDate(d.getDate() + dir);
    else if (view === "Semanal") d.setDate(d.getDate() + dir * 7);
    else if (view === "Mensal") d.setMonth(d.getMonth() + dir);
    else d.setDate(d.getDate() + dir);
    setCurrentDate(d);
  };

  const openAppt = (a: Appointment) => { setSelectedAppt(a); setEditStatus(a.status); setEditPayment(a.paymentMethod || ""); setEditNotes(a.notes); };

  const sortedAppointments = [...mockAppointments].sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime());
  const todayStr = formatDateStr(currentDate);

  const openDayModal = (date: Date) => {
    const ds = formatDateStr(date);
    const appts = sortedAppointments.filter(a => a.date === ds);
    setDayModalDate(ds);
    setDayModalAppts(appts);
  };

  const renderCard = (a: Appointment) => (
    <div key={a.id} onClick={() => openAppt(a)} className="bg-card rounded-xl p-3 sm:p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="text-center min-w-[40px]">
            <p className="text-base font-bold text-foreground">{a.time}</p>
            <p className="text-[10px] text-muted-foreground">{a.duration}min</p>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="min-w-0">
            <div className="flex items-center gap-1">
              <p className="font-semibold text-foreground text-sm truncate">{a.clientName}</p>
              {(a as any).origin === "linkbio" && <Globe className="w-3 h-3 text-primary flex-shrink-0" />}
            </div>
            <p className="text-xs text-muted-foreground truncate">{a.service} · R$ {a.price}</p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 flex-shrink-0">
          <Badge className={cn("border-0 text-[10px] px-1.5 py-0", statusColorMap[a.status])}>{a.status}</Badge>
          <Badge variant="outline" className={cn("border-0 text-[10px] px-1.5 py-0", a.paymentStatus === "Pago" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{a.paymentStatus}</Badge>
        </div>
      </div>
    </div>
  );

  const renderDiario = () => {
    const appts = sortedAppointments.filter(a => a.date === todayStr);
    return <div className="space-y-2">{appts.length === 0 && <p className="text-muted-foreground text-sm text-center py-6">Nenhum agendamento.</p>}{appts.map(renderCard)}</div>;
  };

  const renderSemanal = () => {
    const weekDates = getWeekDates(currentDate);
    const weekDays = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
    return (
      <div className="grid grid-cols-7 gap-0.5 sm:gap-1">
        {weekDays.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
        {weekDates.map((date, i) => {
          const ds = formatDateStr(date); const appts = sortedAppointments.filter(a => a.date === ds);
          return (
            <div key={i} onClick={() => openDayModal(date)} className={cn("min-h-[80px] sm:min-h-[100px] rounded-lg border border-border p-1 cursor-pointer hover:bg-secondary/50", ds === "2026-04-13" && "border-primary/50 bg-primary/5")}>
              <p className={cn("text-xs font-medium mb-0.5", ds === "2026-04-13" ? "text-primary" : "text-muted-foreground")}>{date.getDate()}</p>
              {appts.slice(0, 2).map(a => <div key={a.id} className="text-[9px] p-0.5 rounded bg-primary/10 text-foreground mb-0.5 truncate">{a.time} {a.clientName.split(" ")[0]}</div>)}
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
    return (
      <div className="grid grid-cols-7 gap-0.5">
        {weekDays.map(d => <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>)}
        {days.map((date, i) => {
          if (!date) return <div key={i} />;
          const ds = formatDateStr(date); const appts = sortedAppointments.filter(a => a.date === ds);
          return (
            <button key={i} onClick={() => openDayModal(date)} className={cn("min-h-[36px] sm:min-h-[44px] rounded-md text-xs font-medium flex flex-col items-center justify-start pt-1 transition-colors", ds === "2026-04-13" ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground", appts.length > 0 && ds !== "2026-04-13" && "text-foreground")}>
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
          <p className="text-muted-foreground text-xs sm:text-sm">Gerencie sua agenda</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-secondary rounded-lg p-0.5">
            {views.map(v => <button key={v} onClick={() => setView(v)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors", view === v ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{v}</button>)}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs"><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-md bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Cliente</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Horário</Label><Input type="time" className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Serviço</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{mockServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - R$ {s.price}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-muted-foreground text-xs">Pagamento</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{paymentMethods.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}</SelectContent></Select></div>
                <div><Label className="text-muted-foreground text-xs">Desconto (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input placeholder="Observações..." className="bg-secondary border-border mt-1" /></div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button className="flex-1 gradient-brand text-primary-foreground text-xs">Salvar</Button>
                <Button variant="outline" className="flex-1 border-primary/30 text-primary hover:bg-primary/10 text-xs">Salvar + Ficha</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {legendItems.map(l => <div key={l.label} className="flex items-center gap-1"><div className={cn("w-2 h-2 rounded-full", l.color)} /><span className="text-[10px] text-muted-foreground">{l.label}</span></div>)}
      </div>

      <div className="flex items-center gap-2">
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-8 w-8" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-xs sm:text-sm font-semibold text-foreground">
          {view === "Mensal" ? currentDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" }) : currentDate.toLocaleDateString("pt-BR", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
        </span>
        <Button size="icon" variant="outline" className="border-border text-muted-foreground h-8 w-8" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {view === "Lista" && <div className="space-y-2">{sortedAppointments.map(renderCard)}</div>}
      {view === "Diário" && renderDiario()}
      {view === "Semanal" && renderSemanal()}
      {view === "Mensal" && renderMensal()}

      {/* Detail/Edit modal */}
      <Dialog open={!!selectedAppt} onOpenChange={() => setSelectedAppt(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {selectedAppt && (
            <>
              <DialogHeader><DialogTitle className="text-foreground">Detalhes</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Cliente</p><p className="font-medium text-foreground text-sm">{selectedAppt.clientName}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Serviço</p><p className="font-medium text-foreground text-sm">{selectedAppt.service}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Data/Hora</p><p className="font-medium text-foreground text-sm">{new Date(selectedAppt.date).toLocaleDateString("pt-BR")} {selectedAppt.time}</p></div>
                  <div className="p-2.5 rounded-lg bg-secondary/50"><p className="text-[10px] text-muted-foreground">Valor</p><p className="font-medium text-foreground text-sm">R$ {selectedAppt.price}</p></div>
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
                <Button className="w-full gradient-brand text-primary-foreground text-xs">Salvar Alterações</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Day detail modal from calendar click */}
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
                <div className="min-w-0"><p className="text-sm font-medium text-foreground">{a.clientName}</p><p className="text-xs text-muted-foreground">{a.service} · R$ {a.price}</p></div>
                <div className="text-right flex-shrink-0 ml-2"><p className="text-sm font-semibold text-foreground">{a.time}</p><Badge className={cn("border-0 text-[10px]", statusColorMap[a.status])}>{a.status}</Badge></div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
