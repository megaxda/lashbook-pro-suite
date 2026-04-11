import { useState } from "react";
import { mockServices } from "@/data/mockData";
import { Plus, Scissors } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function ServicosTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Serviços</h2>
          <p className="text-muted-foreground text-sm">{mockServices.length} serviços cadastrados</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Serviço</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Novo Serviço</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Duração (min)</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Preço (R$)</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Preço com desconto</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2"><Label className="text-muted-foreground text-xs">Descrição</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2 flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <Label className="text-sm text-foreground">Disponível para agendamento online</Label>
                <Switch />
              </div>
            </div>
            <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Serviço</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {mockServices.map(s => (
          <div key={s.id} className="gradient-card rounded-xl p-5 border border-border hover:border-primary/20 transition-colors group">
            <div className="flex items-start justify-between mb-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Scissors className="w-4 h-4" />
              </div>
              <Badge className={cn("border-0", s.active ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>
                {s.active ? "Ativo" : "Inativo"}
              </Badge>
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
    </div>
  );
}
