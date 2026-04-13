import { useState } from "react";
import { mockServices, Service } from "@/data/mockData";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ServicosTab() {
  const [services, setServices] = useState<Service[]>([...mockServices]);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Service>>({});

  const openNew = () => {
    setIsNew(true);
    setForm({ name: "", category: "", duration: 60, price: 0, description: "", active: true, onlineBooking: true });
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({ ...s });
  };

  const save = () => {
    if (editing) {
      setServices(prev => prev.map(s => s.id === editing.id ? { ...editing, ...form } as Service : s));
    } else if (isNew) {
      setServices(prev => [...prev, { id: String(Date.now()), ...form } as Service]);
    }
    setEditing(null); setIsNew(false); setForm({});
  };

  const remove = (id: string) => {
    setServices(prev => prev.filter(s => s.id !== id));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Serviços</h2>
          <p className="text-muted-foreground text-sm">{services.length} serviços cadastrados</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Serviço</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} onClick={() => openEdit(s)} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors group cursor-pointer">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Scissors className="w-4 h-4" /></div>
              <div className="flex items-center gap-2">
                <Badge className={cn("border-0", s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                  {s.active ? "Ativo" : "Inativo"}
                </Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); remove(s.id); }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
            <h3 className="font-semibold text-foreground mb-1">{s.name}</h3>
            <p className="text-xs text-muted-foreground mb-3">{s.description}</p>
            <div className="flex items-center justify-between">
              <div>
                {s.discountPrice ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-primary">R$ {s.discountPrice}</span>
                    <span className="text-sm text-muted-foreground line-through">R$ {s.price}</span>
                  </div>
                ) : (
                  <span className="text-lg font-bold text-foreground">R$ {s.price}</span>
                )}
              </div>
              <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">{s.duration}min</span>
            </div>
            <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
              <Badge variant="outline" className="text-xs border-border text-muted-foreground">{s.category}</Badge>
              {s.onlineBooking && <Badge variant="outline" className="text-xs border-primary/30 text-primary">Online</Badge>}
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing || isNew} onOpenChange={() => { setEditing(null); setIsNew(false); }}>
        <DialogContent className="max-w-lg bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Duração (min)</Label><Input type="number" value={form.duration ?? ""} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço (R$)</Label><Input type="number" value={form.price ?? ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço com desconto</Label><Input type="number" value={form.discountPrice ?? ""} onChange={e => setForm({ ...form, discountPrice: Number(e.target.value) || undefined })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Disponível para agendamento online</Label>
              <Switch checked={form.onlineBooking ?? true} onCheckedChange={v => setForm({ ...form, onlineBooking: v })} />
            </div>
            <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Ativo</Label>
              <Switch checked={form.active ?? true} onCheckedChange={v => setForm({ ...form, active: v })} />
            </div>
          </div>
          <Button onClick={save} className="w-full mt-4 gradient-brand text-primary-foreground">Salvar Serviço</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
