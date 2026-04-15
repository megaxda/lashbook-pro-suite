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

  const openNew = () => { setIsNew(true); setForm({ name: "", category: "", duration: 60, price: 0, description: "", active: true, onlineBooking: true }); };
  const openEdit = (s: Service) => { setEditing(s); setForm({ ...s }); };

  const save = () => {
    if (editing) setServices(prev => prev.map(s => s.id === editing.id ? { ...editing, ...form } as Service : s));
    else if (isNew) setServices(prev => [...prev, { id: String(Date.now()), ...form } as Service]);
    setEditing(null); setIsNew(false); setForm({});
  };

  const remove = (id: string) => setServices(prev => prev.filter(s => s.id !== id));

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Serviços</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">{services.length} serviços</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1" /> Novo</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {services.map(s => (
          <div key={s.id} onClick={() => openEdit(s)} className="bg-card rounded-xl p-4 border border-border hover:border-primary/20 transition-colors cursor-pointer">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary"><Scissors className="w-3.5 h-3.5" /></div>
                <h3 className="font-semibold text-foreground text-sm">{s.name}</h3>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); remove(s.id); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {s.discountPrice ? (
                  <>
                    <span className="text-base font-bold text-primary">R$ {s.discountPrice}</span>
                    <span className="text-xs text-muted-foreground line-through">R$ {s.price}</span>
                  </>
                ) : (
                  <span className="text-base font-bold text-foreground">R$ {s.price}</span>
                )}
              </div>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{s.duration}min</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Badge variant="outline" className="text-[10px] border-border text-muted-foreground px-1.5 py-0">{s.category}</Badge>
              {s.onlineBooking && <Badge variant="outline" className="text-[10px] border-primary/30 text-primary px-1.5 py-0">Online</Badge>}
              <Badge className={cn("text-[10px] border-0 px-1.5 py-0", s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{s.active ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={!!editing || isNew} onOpenChange={() => { setEditing(null); setIsNew(false); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Duração (min)</Label><Input type="number" value={form.duration ?? ""} onChange={e => setForm({ ...form, duration: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço (R$)</Label><Input type="number" value={form.price ?? ""} onChange={e => setForm({ ...form, price: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço c/ desconto</Label><Input type="number" value={form.discountPrice ?? ""} onChange={e => setForm({ ...form, discountPrice: Number(e.target.value) || undefined })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={form.description || ""} onChange={e => setForm({ ...form, description: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Agendamento online</Label>
              <Switch checked={form.onlineBooking ?? true} onCheckedChange={v => setForm({ ...form, onlineBooking: v })} />
            </div>
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Ativo</Label>
              <Switch checked={form.active ?? true} onCheckedChange={v => setForm({ ...form, active: v })} />
            </div>
          </div>
          <Button onClick={save} className="w-full mt-3 gradient-brand text-primary-foreground">Salvar Serviço</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
