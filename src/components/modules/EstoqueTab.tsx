import { useState } from "react";
import { mockProducts } from "@/data/mockData";
import { Package, Plus, AlertTriangle, TrendingDown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function EstoqueTab() {
  const totalValue = mockProducts.reduce((s, p) => s + p.costPrice * p.currentQuantity, 0);
  const belowMin = mockProducts.filter(p => p.currentQuantity < p.minIdealQuantity);
  const nearExpiry = mockProducts.filter(p => {
    const d = new Date(p.expirationDate);
    const now = new Date(2026, 3, 11);
    return (d.getTime() - now.getTime()) / 86400000 < 120;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-sm">Controle de materiais e insumos</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg bg-card border-border">
            <DialogHeader><DialogTitle className="text-foreground">Cadastrar Produto</DialogTitle></DialogHeader>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">SKU</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Unidade</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Qtd. Atual</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Qtd. Mínima Ideal</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Preço de Custo</Label><Input type="number" className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Marca</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div><Label className="text-muted-foreground text-xs">Fornecedor</Label><Input className="bg-secondary border-border mt-1" /></div>
              <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
                <p className="text-xs text-muted-foreground">Reposição Sugerida</p>
                <p className="text-lg font-bold text-primary">0 unidades</p>
              </div>
            </div>
            <Button className="w-full mt-4 gradient-pink text-primary-foreground">Salvar Produto</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} title="Total de Produtos" value={mockProducts.length} />
        <StatCard icon={Package} title="Valor do Estoque" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} />
        <StatCard icon={AlertTriangle} title="Abaixo do Mínimo" value={belowMin.length} />
        <StatCard icon={TrendingDown} title="Próx. ao Vencimento" value={nearExpiry.length} />
      </div>

      <div className="gradient-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Produto</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">SKU</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Qtd.</th>
              <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Mín.</th>
              <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Reposição</th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden sm:table-cell">Custo</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {mockProducts.map(p => {
                const restock = p.currentQuantity >= p.minIdealQuantity ? 0 : p.minIdealQuantity - p.currentQuantity;
                const isLow = p.currentQuantity < p.minIdealQuantity;
                return (
                  <tr key={p.id} className="border-b border-border/50 hover:bg-secondary/50 transition-colors">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </td>
                    <td className="p-3 text-muted-foreground hidden sm:table-cell font-mono text-xs">{p.sku}</td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className={cn("p-3 text-center font-semibold", isLow ? "text-destructive" : "text-foreground")}>{p.currentQuantity}</td>
                    <td className="p-3 text-center text-muted-foreground hidden lg:table-cell">{p.minIdealQuantity}</td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      {restock > 0 ? <span className="text-warning font-semibold">{restock}</span> : <span className="text-success">0</span>}
                    </td>
                    <td className="p-3 text-right text-muted-foreground hidden sm:table-cell">R$ {p.costPrice.toFixed(2)}</td>
                    <td className="p-3 text-center">
                      <Badge className={cn("border-0", isLow ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success")}>
                        {isLow ? "Baixo" : "OK"}
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
