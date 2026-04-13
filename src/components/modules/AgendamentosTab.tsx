import { useState } from "react";
import { useAgendamentos, useServicos, useClientes } from "@/hooks/useSupabaseData";
import type { Appointment } from "@/data/mockData";import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import type { Appointment } from "@/data/mockData";

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
];

const allStatuses = ["Confirmado", "Pendente", "Em atendimento", "Concluído", "Cancelado", "No-show"] as const;

export default function AgendamentosTab() {
  const [currentDate, setCurrentDate] = useState(new Date(2026, 3, 11));
  const { agendamentos, isLoading: isLoadingAgendamentos } = useAgendamentos();
  const [appointments, setAppointments] = useState(agendamentos);  const [editAppt, setEditAppt] = useState<Appointment | null>(null);

  const goDay = (dir: number) => {
    setCurrentDate(prev => {
      const d = new Date(prev);
      d.setDate(d.getDate() + dir);
      return d;
    });
  };

  const dateStr = currentDate.toISOString().slice(0, 10);
  const dayAppts = appointments.filter(a => a.date === dateStr).sort((a, b) => a.time.localeCompare(b.time));

  const handleSaveEdit = () => {
    if (!editAppt) return;
    setAppointments(prev => prev.map(a => a.id === editAppt.id ? editAppt : a));
    setEditAppt(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground text-sm">Gerencie sua agenda</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>Novo Agendamento</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">Cliente</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs text-muted-foreground">Data</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Horário</Label><Input type="time" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">Serviço</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                  <SelectContent className="bg-card border-border">{mockServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - R${s.price}</SelectItem>)}</SelectContent></Select></div>
              <div><Label className="text-xs text-muted-foreground">Pagamento</Label>
                <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Forma" /></SelectTrigger>
                  <SelectContent className="bg-card border-border"><SelectItem value="pix">PIX</SelectItem><SelectItem value="credito">Cartão</SelectItem><SelectItem value="dinheiro">Dinheiro</SelectItem></SelectContent></Select></div>
              <div><Label className="text-xs text-muted-foreground">Desconto (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">Observações</Label><Input className="bg-secondary border-border mt-1" /></div>
            </div>
            <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Agendamento</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-wrap gap-2">
        {legendItems.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", l.color)} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" className="border-border" onClick={() => goDay(-1)}><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold text-foreground flex-1 text-center">
          {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <Button size="icon" variant="outline" className="border-border" onClick={() => goDay(1)}><ChevronRight className="w-4 h-4" /></Button>
      </div>

      <div className="space-y-2">
        {dayAppts.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum agendamento neste dia.</p>}
        {dayAppts.map(a => (
          <div key={a.id} onClick={() => setEditAppt({...a})} className="gradient-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="text-center min-w-[50px]">
                  <p className="text-lg font-bold text-foreground">{a.time}</p>
                  <p className="text-[10px] text-muted-foreground">{a.duration}min</p>
                </div>
                <div className="w-px h-10 bg-border" />
                <div>
                  <p className="font-semibold text-foreground">{a.clientName}</p>
                  <p className="text-sm text-muted-foreground">{a.service} · R$ {a.price}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge className={cn("border-0", statusColorMap[a.status])}>{a.status}</Badge>
                <Badge variant="outline" className={cn("border-0", a.paymentStatus === "Pago" ? "bg-success/15 text-success" : "bg-warning/15 text-warning")}>{a.paymentStatus}</Badge>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Appointment Modal */}
      <Dialog open={!!editAppt} onOpenChange={() => setEditAppt(null)}>
        <DialogContent className="max-w-md bg-card border-border">
          {editAppt && (
            <>
              <DialogHeader><DialogTitle>Editar Agendamento</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><p className="text-sm text-muted-foreground">Cliente: <span className="text-foreground font-medium">{editAppt.clientName}</span></p></div>
                <div><p className="text-sm text-muted-foreground">Serviço: <span className="text-foreground font-medium">{editAppt.service} · R$ {editAppt.price}</span></p></div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={editAppt.status} onValueChange={v => setEditAppt({...editAppt, status: v as Appointment["status"]})}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{allStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Pagamento</Label>
                  <Select value={editAppt.paymentStatus} onValueChange={v => setEditAppt({...editAppt, paymentStatus: v as Appointment["paymentStatus"]})}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="Pendente">Pendente</SelectItem><SelectItem value="Parcial">Parcial</SelectItem><SelectItem value="Pago">Pago</SelectItem></SelectContent>
                  </Select>
                </div>
                <div><Label className="text-xs text-muted-foreground">Observações</Label><Input value={editAppt.notes} onChange={e => setEditAppt({...editAppt, notes: e.target.value})} className="bg-secondary border-border mt-1" /></div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditAppt(null)}>Cancelar</Button>
                <Button className="gradient-pink text-primary-foreground" onClick={handleSaveEdit}>Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
