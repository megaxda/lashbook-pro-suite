import { useState } from "react";
import { Calendar, DollarSign, AlertTriangle, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { mockAppointments, mockTransactions, mockProducts, mockClients, Appointment } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const chartDataAgendamentos = [
  { name: "Jan", agendamentos: 18 },
  { name: "Fev", agendamentos: 22 },
  { name: "Mar", agendamentos: 28 },
  { name: "Abr", agendamentos: 15 },
];

const revenueViews = {
  diario: [
    { name: "Seg", receita: 350 },
    { name: "Ter", receita: 450 },
    { name: "Qua", receita: 280 },
    { name: "Qui", receita: 0 },
    { name: "Sex", receita: 380 },
    { name: "Sáb", receita: 200 },
  ],
  semanal: [
    { name: "Sem 1", receita: 1630 },
    { name: "Sem 2", receita: 1910 },
    { name: "Sem 3", receita: 680 },
  ],
  quinzenal: [
    { name: "1ª Quinz.", receita: 3540 },
    { name: "2ª Quinz.", receita: 680 },
  ],
  mensal: [
    { name: "Jan", receita: 4200 },
    { name: "Fev", receita: 5100 },
    { name: "Mar", receita: 6800 },
    { name: "Abr", receita: 3900 },
  ],
};

const statusColorMap: Record<string, string> = {
  Confirmado: "bg-success/15 text-success",
  Pendente: "bg-warning/15 text-warning",
  "Em atendimento": "bg-info/15 text-info",
  Concluído: "bg-muted text-muted-foreground",
  Cancelado: "bg-destructive/15 text-destructive",
  "No-show": "bg-destructive/20 text-destructive",
};

function formatDateStr(d: Date) {
  return d.toISOString().slice(0, 10);
}

function getDaysInMonth(date: Date) {
  const year = date.getFullYear();
  const month = date.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const days: (Date | null)[] = [];
  const startOffset = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < startOffset; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
  return days;
}

function getWeekDates(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return d;
  });
}

export default function DashboardTab() {
  const navigate = useNavigate();
  const [calendarDate, setCalendarDate] = useState(new Date(2026, 3, 11));
  const [selectedDayAppts, setSelectedDayAppts] = useState<Appointment[] | null>(null);
  const [selectedDayStr, setSelectedDayStr] = useState("");
  const [revenueView, setRevenueView] = useState<keyof typeof revenueViews>("mensal");
  const [agendaTab, setAgendaTab] = useState<"hoje" | "semana" | "mes">("hoje");

  const todayStr = "2026-04-11";
  const todayAppointments = mockAppointments.filter(a => a.date === todayStr).sort((a, b) => a.time.localeCompare(b.time));
  const monthRevenue = mockTransactions.filter(t => t.type === "receita" && t.date.startsWith("2026-04")).reduce((s, t) => s + t.amount, 0);
  const lowStock = mockProducts.filter(p => p.currentQuantity < p.minIdealQuantity);
  const followUpClients = mockClients.filter(c => {
    const daysSince = Math.floor((new Date("2026-04-13").getTime() - new Date(c.lastVisit).getTime()) / 86400000);
    return daysSince > 21;
  });

  const weekDates = getWeekDates(calendarDate);
  const weekAppointments = mockAppointments.filter(a => {
    return weekDates.some(d => formatDateStr(d) === a.date);
  }).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  const monthAppointments = mockAppointments.filter(a => {
    const d = new Date(a.date);
    return d.getMonth() === calendarDate.getMonth() && d.getFullYear() === calendarDate.getFullYear();
  });

  const openDayModal = (date: Date) => {
    const ds = formatDateStr(date);
    const appts = mockAppointments.filter(a => a.date === ds).sort((a, b) => a.time.localeCompare(b.time));
    setSelectedDayStr(ds);
    setSelectedDayAppts(appts);
  };

  const days = getDaysInMonth(calendarDate);
  const weekDays = ["S", "T", "Q", "Q", "S", "S", "D"];

  const renderAppointmentRow = (a: Appointment) => (
    <div key={a.id} className="flex items-center justify-between p-2.5 sm:p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.status === "Confirmado" ? "hsl(145,63%,42%)" : a.status === "Pendente" ? "hsl(45,93%,47%)" : "hsl(0,0%,45%)" }} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
          <p className="text-xs text-muted-foreground truncate">{a.service}</p>
        </div>
      </div>
      <div className="text-right flex-shrink-0 ml-2">
        <p className="text-sm font-semibold text-foreground">{a.time}</p>
        <Badge className={cn("border-0 text-[10px] px-1.5 py-0", statusColorMap[a.status])}>{a.status}</Badge>
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Bem-vinda! ✨</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Resumo do seu dia.</p>
      </div>

      {/* Pill summary - 2 side by side */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 sm:gap-3 p-3 sm:p-4 rounded-xl bg-card border border-border">
          <div className="p-2 rounded-lg bg-primary/10 flex-shrink-0"><Calendar className="w-4 h-4 text-primary" /></div>
          <div className="min-w-0">
            <p className="text-lg sm:text-2xl font-bold text-foreground">{todayAppointments.length}</p>
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

      {/* Appointments block with tabs */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-foreground">Agendamentos</h3>
          <div className="flex bg-secondary rounded-lg p-0.5">
            {(["hoje", "semana", "mes"] as const).map(t => (
              <button key={t} onClick={() => setAgendaTab(t)} className={cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors capitalize", agendaTab === t ? "gradient-brand text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {t === "hoje" ? "Hoje" : t === "semana" ? "Semana" : "Mês"}
              </button>
            ))}
          </div>
        </div>

        {agendaTab === "hoje" && (
          <div className="space-y-1.5">
            {todayAppointments.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento hoje.</p>}
            {todayAppointments.map(renderAppointmentRow)}
          </div>
        )}

        {agendaTab === "semana" && (
          <div className="space-y-1.5">
            {weekAppointments.length === 0 && <p className="text-muted-foreground text-sm text-center py-4">Nenhum agendamento esta semana.</p>}
            {weekAppointments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-2.5 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.status === "Confirmado" ? "hsl(145,63%,42%)" : "hsl(45,93%,47%)" }} />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("pt-BR", { weekday: "short", day: "numeric" })} · {a.service}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-foreground ml-2">{a.time}</p>
              </div>
            ))}
          </div>
        )}

        {agendaTab === "mes" && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() - 1); setCalendarDate(d); }}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-sm font-medium text-foreground capitalize">{calendarDate.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { const d = new Date(calendarDate); d.setMonth(d.getMonth() + 1); setCalendarDate(d); }}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map(d => (
                <div key={d} className="text-center text-[10px] font-semibold text-muted-foreground py-1">{d}</div>
              ))}
              {days.map((date, i) => {
                if (!date) return <div key={i} />;
                const ds = formatDateStr(date);
                const appts = mockAppointments.filter(a => a.date === ds);
                const isToday = ds === todayStr;
                return (
                  <button key={i} onClick={() => openDayModal(date)}
                    className={cn(
                      "relative min-h-[36px] sm:min-h-[44px] rounded-md text-xs font-medium transition-colors flex flex-col items-center justify-start pt-1",
                      isToday ? "bg-primary/15 text-primary border border-primary/30" : "hover:bg-secondary text-muted-foreground",
                      appts.length > 0 && !isToday && "text-foreground"
                    )}>
                    {date.getDate()}
                    {appts.length > 0 && (
                      <div className="flex gap-0.5 mt-0.5">
                        {appts.slice(0, 3).map((_, j) => <div key={j} className="w-1 h-1 rounded-full bg-primary" />)}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-foreground">Receita</h3>
            <div className="flex bg-secondary rounded-lg p-0.5">
              {(Object.keys(revenueViews) as (keyof typeof revenueViews)[]).map(v => (
                <button key={v} onClick={() => setRevenueView(v)} className={cn("px-2 py-0.5 rounded-md text-[10px] font-medium transition-colors capitalize", revenueView === v ? "gradient-brand text-primary-foreground" : "text-muted-foreground")}>
                  {v === "diario" ? "Dia" : v === "semanal" ? "Sem" : v === "quinzenal" ? "Quinz" : "Mês"}
                </button>
              ))}
            </div>
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={revenueViews[revenueView]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,4%,24%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={11} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(40,4%,18%)", border: "1px solid hsl(40,4%,24%)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="receita" fill="hsl(0,76%,42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Agendamentos por Mês</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartDataAgendamentos}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,4%,24%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={11} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(40,4%,18%)", border: "1px solid hsl(40,4%,24%)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="agendamentos" fill="hsl(0,76%,42%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Alerts section at bottom */}
      <div className="bg-card rounded-xl p-3 sm:p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas</h3>
        <div className="space-y-2">
          {lowStock.map(p => (
            <div key={p.id} onClick={() => navigate("/home_profissional?tab=Estoque")} className="flex items-center justify-between p-2.5 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                <p className="text-xs text-muted-foreground">Estoque: {p.currentQuantity} / Mín: {p.minIdealQuantity}</p>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-destructive/15 text-destructive flex-shrink-0 ml-2">Baixo</span>
            </div>
          ))}
          {followUpClients.length > 0 && (
            <div onClick={() => navigate("/home_profissional?tab=Clientes")} className="p-2.5 rounded-lg bg-warning/5 border border-warning/10 cursor-pointer hover:bg-warning/10 transition-colors">
              <p className="text-sm font-medium text-foreground">Follow-up pendente</p>
              <p className="text-xs text-muted-foreground">{followUpClients.length} clientes sem retorno há mais de 21 dias</p>
            </div>
          )}
        </div>
      </div>

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
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.clientName}</p>
                  <p className="text-xs text-muted-foreground">{a.service} · R$ {a.price}</p>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-sm font-semibold text-foreground">{a.time}</p>
                  <Badge className={cn("border-0 text-[10px]", statusColorMap[a.status])}>{a.status}</Badge>
                </div>
              </div>
            ))}
          </div>
          <Button onClick={() => { setSelectedDayAppts(null); navigate(`/home_profissional?tab=Agendamentos`); }} className="w-full gradient-brand text-primary-foreground mt-2">
            <Plus className="w-4 h-4 mr-1" /> Novo Agendamento
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
