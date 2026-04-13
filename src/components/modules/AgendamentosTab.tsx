import { useState } from "react";
import { mockAppointments, mockServices, mockClients } from "@/data/mockData";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

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

export default function AgendamentosTab() {
  const [view, setView] = useState<typeof views[number]>("Lista");
  const [currentDate] = useState(new Date(2026, 3, 11));

  const sortedAppointments = [...mockAppointments].sort((a, b) => {
    const da = new Date(`${a.date}T${a.time}`);
    const db = new Date(`${b.date}T${b.time}`);
    return da.getTime() - db.getTime();
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Agendamentos</h2>
          <p className="text-muted-foreground text-sm">Gerencie sua agenda</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-secondary rounded-lg p-0.5">
            {views.map(v => (
              <button key={v} onClick={() => setView(v)} className={cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", view === v ? "gradient-pink text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>
                {v}
              </button>
            ))}
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg bg-card border-border">
              <DialogHeader><DialogTitle className="text-foreground">Novo Agendamento</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Cliente</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-muted-foreground text-xs">Horário</Label><Input type="time" className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2">
                  <Label className="text-muted-foreground text-xs">Serviço</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">{mockServices.map(s => <SelectItem key={s.id} value={s.id}>{s.name} - R$ {s.price}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Forma de Pagamento</Label>
                  <Select><SelectTrigger className="bg-secondary border-border mt-1"><SelectValue placeholder="Selecione..." /></SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credito">Cartão Crédito</SelectItem>
                      <SelectItem value="debito">Cartão Débito</SelectItem>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div><Label className="text-muted-foreground text-xs">Desconto (R$)</Label><Input type="number" placeholder="0" className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2"><Label className="text-muted-foreground text-xs">Observações</Label><Input placeholder="Observações..." className="bg-secondary border-border mt-1" /></div>
              </div>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 gradient-pink text-primary-foreground">Salvar Agendamento</Button>
                <Button variant="outline" className="flex-1 border-primary/30 text-primary hover:bg-primary/10">Salvar e Criar Ficha</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {legendItems.map(l => (
          <div key={l.label} className="flex items-center gap-1.5">
            <div className={cn("w-2.5 h-2.5 rounded-full", l.color)} />
            <span className="text-xs text-muted-foreground">{l.label}</span>
          </div>
        ))}
      </div>

      {/* Date nav */}
      <div className="flex items-center gap-3">
        <Button size="icon" variant="outline" className="border-border text-muted-foreground"><ChevronLeft className="w-4 h-4" /></Button>
        <span className="text-sm font-semibold text-foreground">
          {currentDate.toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </span>
        <Button size="icon" variant="outline" className="border-border text-muted-foreground"><ChevronRight className="w-4 h-4" /></Button>
      </div>

      {/* List view */}
      <div className="space-y-2">
        {sortedAppointments.map(a => (
          <div key={a.id} className="gradient-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors">
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
                  <p className="text-xs text-muted-foreground">{new Date(a.date).toLocaleDateString("pt-BR")}</p>
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
    </div>
  );
}
