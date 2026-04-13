import { useState } from "react";
import { mockServices } from "@/data/mockData";
import { Plus, Scissors, Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Service } from "@/data/mockData";

const emptyService: Service = { id: "", name: "", category: "", duration: 60, price: 0, description: "", active: true, onlineBooking: true };

export default function ServicosTab() {
  const [services, setServices] = useState(mockServices);
  const [editing, setEditing] = useState<Service | null>(null);
  const [isNew, setIsNew] = useState(false);

  const openNew = () => { setEditing({ ...emptyService, id: String(Date.now()) }); setIsNew(true); };
  const openEdit = (s: Service) => { setEditing({ ...s }); setIsNew(false); };
  const handleDelete = (id: string) => setServices(prev => prev.filter(s => s.id !== id));

  const handleSave = () => {
    if (!editing) return;
    if (isNew) {
      setServices(prev => [...prev, editing]);
    } else {
      setServices(prev => prev.map(s => s.id === editing.id ? editing : s));
    }
    setEditing(null);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Serviços</h2>
          <p className="text-muted-foreground text-sm">{services.length} serviços cadastrados</p>
        </div>
        <Button size="sm" className="gradient-pink text-primary-foreground" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Serviço</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {services.map(s => (
          <div key={s.id} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary"><Scissors className="w-4 h-4" /></div>
              <div className="flex items-center gap-1">
                <Badge className={cn("border-0", s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{s.active ? "Ativo" : "Inativo"}</Badge>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground" onClick={() => openEdit(s)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="icon" variant="ghost" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => handleDelete(s.id)}><Trash2 className="w-3.5 h-3.5" /></Button>
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

      {/* Edit/Create Dialog */}
      <Dialog open={!!editing} onOpenChange={() => setEditing(null)}>
        <DialogContent className="max-w-lg bg-card border-border">
          {editing && (
            <>
              <DialogHeader><DialogTitle>{isNew ? "Novo Serviço" : "Editar Serviço"}</DialogTitle></DialogHeader>
              <div className="grid grid-cols-2 gap-3 mt-2">
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Nome</Label><Input value={editing.name} onChange={e => setEditing({...editing, name: e.target.value})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Categoria</Label><Input value={editing.category} onChange={e => setEditing({...editing, category: e.target.value})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Duração (min)</Label><Input type="number" value={editing.duration} onChange={e => setEditing({...editing, duration: Number(e.target.value)})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Preço (R$)</Label><Input type="number" value={editing.price} onChange={e => setEditing({...editing, price: Number(e.target.value)})} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Preço c/ desconto</Label><Input type="number" value={editing.discountPrice || ""} onChange={e => setEditing({...editing, discountPrice: e.target.value ? Number(e.target.value) : undefined})} className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2"><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={editing.description} onChange={e => setEditing({...editing, description: e.target.value})} className="bg-secondary border-border mt-1" /></div>
                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <Label className="text-sm text-foreground">Ativo</Label>
                  <Switch checked={editing.active} onCheckedChange={v => setEditing({...editing, active: v})} />
                </div>
                <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                  <Label className="text-sm text-foreground">Agendamento online</Label>
                  <Switch checked={editing.onlineBooking} onCheckedChange={v => setEditing({...editing, onlineBooking: v})} />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setEditing(null)}>Cancelar</Button>
                <Button className="gradient-pink text-primary-foreground" onClick={handleSave}>Salvar</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
