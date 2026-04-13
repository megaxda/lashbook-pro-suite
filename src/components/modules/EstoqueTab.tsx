import { useState } from "react";
import { mockProducts, Product } from "@/data/mockData";
import { Package, Plus, AlertTriangle, TrendingDown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export default function EstoqueTab() {
  const [products, setProducts] = useState<Product[]>([...mockProducts]);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [newProduct, setNewProduct] = useState(false);
  const [form, setForm] = useState<Partial<Product>>({});

  const totalValue = products.reduce((s, p) => s + p.costPrice * p.currentQuantity, 0);
  const belowMin = products.filter(p => p.currentQuantity < p.minIdealQuantity);
  const nearExpiry = products.filter(p => {
    const d = new Date(p.expirationDate);
    const now = new Date(2026, 3, 11);
    return (d.getTime() - now.getTime()) / 86400000 < 120;
  });

  const openEdit = (p: Product) => {
    setEditProduct(p);
    setForm({ ...p });
  };

  const openNew = () => {
    setNewProduct(true);
    setForm({ name: "", category: "", unit: "", currentQuantity: 0, minIdealQuantity: 0, costPrice: 0, brand: "", supplier: "", expirationDate: "" });
  };

  const saveProduct = () => {
    if (editProduct) {
      setProducts(prev => prev.map(p => p.id === editProduct.id ? { ...editProduct, ...form } as Product : p));
      setEditProduct(null);
    } else if (newProduct) {
      const p: Product = { id: String(Date.now()), ...form } as Product;
      setProducts(prev => [...prev, p]);
      setNewProduct(false);
    }
    setForm({});
  };

  const restock = (f: Partial<Product>) => {
    const cur = f.currentQuantity || 0;
    const min = f.minIdealQuantity || 0;
    return cur >= min ? 0 : min - cur;
  };

  const formDialog = (
    <DialogContent className="max-w-lg bg-card border-border">
      <DialogHeader><DialogTitle className="text-foreground">{editProduct ? "Editar Produto" : "Cadastrar Produto"}</DialogTitle></DialogHeader>
      <div className="grid grid-cols-2 gap-3 mt-2">
        <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={form.name || ""} onChange={e => setForm({ ...form, name: e.target.value })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={form.category || ""} onChange={e => setForm({ ...form, category: e.target.value })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Unidade</Label><Input value={form.unit || ""} onChange={e => setForm({ ...form, unit: e.target.value })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Qtd. Atual</Label><Input type="number" value={form.currentQuantity ?? ""} onChange={e => setForm({ ...form, currentQuantity: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Qtd. Mínima Ideal</Label><Input type="number" value={form.minIdealQuantity ?? ""} onChange={e => setForm({ ...form, minIdealQuantity: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Preço de Custo</Label><Input type="number" value={form.costPrice ?? ""} onChange={e => setForm({ ...form, costPrice: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Marca</Label><Input value={form.brand || ""} onChange={e => setForm({ ...form, brand: e.target.value })} className="bg-secondary border-border mt-1" /></div>
        <div><Label className="text-muted-foreground text-xs">Fornecedor</Label><Input value={form.supplier || ""} onChange={e => setForm({ ...form, supplier: e.target.value })} className="bg-secondary border-border mt-1" /></div>
        <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
          <p className="text-xs text-muted-foreground">Reposição Sugerida</p>
          <p className="text-lg font-bold text-primary">{restock(form)} unidades</p>
        </div>
      </div>
      <Button onClick={saveProduct} className="w-full mt-4 gradient-brand text-primary-foreground">Salvar Produto</Button>
    </DialogContent>
  );

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-sm">Controle de materiais e insumos</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground" onClick={openNew}><Plus className="w-4 h-4 mr-1" /> Novo Produto</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Package} title="Total de Produtos" value={products.length} />
        <StatCard icon={Package} title="Valor do Estoque" value={`R$ ${totalValue.toLocaleString("pt-BR")}`} />
        <StatCard icon={AlertTriangle} title="Abaixo do Mínimo" value={belowMin.length} />
        <StatCard icon={TrendingDown} title="Próx. ao Vencimento" value={nearExpiry.length} />
      </div>

      <div className="gradient-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-3 text-muted-foreground font-medium">Produto</th>
              <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Qtd.</th>
              <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Mín.</th>
              <th className="text-center p-3 text-muted-foreground font-medium hidden lg:table-cell">Reposição</th>
              <th className="text-right p-3 text-muted-foreground font-medium hidden sm:table-cell">Custo</th>
              <th className="text-center p-3 text-muted-foreground font-medium">Status</th>
            </tr></thead>
            <tbody>
              {products.map(p => {
                const restockQty = p.currentQuantity >= p.minIdealQuantity ? 0 : p.minIdealQuantity - p.currentQuantity;
                const isLow = p.currentQuantity < p.minIdealQuantity;
                return (
                  <tr key={p.id} onClick={() => openEdit(p)} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <td className="p-3">
                      <p className="font-medium text-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    </td>
                    <td className="p-3 text-muted-foreground hidden md:table-cell">{p.category}</td>
                    <td className={cn("p-3 text-center font-semibold", isLow ? "text-destructive" : "text-foreground")}>{p.currentQuantity}</td>
                    <td className="p-3 text-center text-muted-foreground hidden lg:table-cell">{p.minIdealQuantity}</td>
                    <td className="p-3 text-center hidden lg:table-cell">
                      {restockQty > 0 ? <span className="text-warning font-semibold">{restockQty}</span> : <span className="text-success">0</span>}
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

      {/* Edit / New Product Dialog */}
      <Dialog open={!!editProduct || newProduct} onOpenChange={() => { setEditProduct(null); setNewProduct(false); }}>
        {formDialog}
      </Dialog>
    </div>
  );
}
