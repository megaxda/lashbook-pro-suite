import { useState } from "react";
import { useEstoque } from "@/hooks/useSupabaseData";
import type { Product } from "@/data/mockData";import { Package, Plus, AlertTriangle, TrendingDown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function EstoqueTab() {
  const { estoque, isLoading: isLoadingEstoque } = useEstoque();
  const belowMin = estoque.filter(p => p.currentQuantity < p.minIdealQuantity);
  const nearExpiry = estoque.filter(p => {
    const d = new Date(p.expirationDate);
    const now = new Date(2026, 3, 13);  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-sm">Controle de materiais</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle>Cadastrar Produto</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-xs text-muted-foreground">Nome</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Categoria</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Unidade</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Qtd. Atual</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Qtd. Mínima Ideal</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Preço de Custo</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Marca</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Fornecedor</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-xs text-muted-foreground">Validade</Label><Input type="date" className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">Reposição Sugerida</p>
                <p className="text-lg font-bold text-primary">0 unidades</p>
              </div>
            </div>
            <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Produto</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Package} title="Total" value={mockProducts.length} />
        <StatCard icon={Package} title="Valor" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} />
        <StatCard icon={AlertTriangle} title="Abaixo Mín." value={belowMin.length} />
        <StatCard icon={TrendingDown} title="Próx. Venc." value={nearExpiry.length} />
      </div>

      <div className="space-y-2">
        {mockProducts.map(p => {
          const restock = p.currentQuantity >= p.minIdealQuantity ? 0 : p.minIdealQuantity - p.currentQuantity;
          const isLow = p.currentQuantity < p.minIdealQuantity;
          return (
            <div key={p.id} className="gradient-card rounded-xl p-4 border border-border">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-medium text-foreground text-sm">{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.brand} · {p.category} · {p.supplier}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <div className="text-right">
                    <p className={cn("text-sm font-bold", isLow ? "text-destructive" : "text-foreground")}>{p.currentQuantity}/{p.minIdealQuantity}</p>
                    <p className="text-[10px] text-muted-foreground">R$ {p.costPrice.toFixed(2)}</p>
                  </div>
                  <Badge className={cn("border-0 text-[10px]", isLow ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success")}>
                    {isLow ? `Repor ${restock}` : "OK"}
                  </Badge>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
