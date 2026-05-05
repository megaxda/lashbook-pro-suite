import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoEstoque } from "@/data/demoData";
import { Package, Plus, AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Produto {
  id: string;
  nome: string;
  marca: string | null;
  quantidade: number | null;
  quantidade_minima: number | null;
  unidade: string | null;
  preco_custo: number | null;
  fornecedor: string | null;
  user_id: string;
}

export default function EstoqueTab() {
  const { user, isDemo } = useAuth();
  const [products, setProducts] = useState<Produto[]>([]);
  const [loading, setLoading] = useState(true);
  const [editProduct, setEditProduct] = useState<Produto | null>(null);
  const [newProduct, setNewProduct] = useState(false);
  const [form, setForm] = useState<Partial<Produto>>({});
  const [saving, setSaving] = useState(false);

  const fetchProducts = async () => {
    if (isDemo) { setProducts(demoEstoque as Produto[]); setLoading(false); return; }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("estoque").select("*").eq("user_id", user.id).order("nome");
    if (error) toast.error("Erro ao carregar estoque");
    else setProducts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [user, isDemo]);

  const demoBlock = () => { if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return true; } return false; };

  const totalValue = products.reduce((s, p) => s + (p.preco_custo || 0) * (p.quantidade || 0), 0);
  const belowMin = products.filter(p => (p.quantidade || 0) < (p.quantidade_minima || 0));

  const openEdit = (p: Produto) => { setEditProduct(p); setForm({ ...p }); };
  const openNew = () => { setNewProduct(true); setForm({ nome: "", marca: "", unidade: "un", quantidade: 0, quantidade_minima: 0, preco_custo: 0, fornecedor: "" }); };

  const saveProduct = async () => {
    if (!form.nome?.trim()) { toast.error("Nome é obrigatório"); return; }
    if (demoBlock()) { setEditProduct(null); setNewProduct(false); setForm({}); return; }
    if (!user) return;
    setSaving(true);
    if (editProduct) {
      const { error } = await supabase.from("estoque").update({ nome: form.nome, marca: form.marca, quantidade: form.quantidade, quantidade_minima: form.quantidade_minima, unidade: form.unidade, preco_custo: form.preco_custo, fornecedor: form.fornecedor }).eq("id", editProduct.id);
      if (error) { toast.error("Erro ao atualizar"); setSaving(false); return; }
      toast.success("Produto atualizado!");
      setEditProduct(null);
    } else {
      const { error } = await supabase.from("estoque").insert({ nome: form.nome!, marca: form.marca, quantidade: form.quantidade, quantidade_minima: form.quantidade_minima, unidade: form.unidade, preco_custo: form.preco_custo, fornecedor: form.fornecedor, user_id: user.id });
      if (error) { toast.error("Erro ao criar"); setSaving(false); return; }
      toast.success("Produto cadastrado!");
      setNewProduct(false);
    }
    setSaving(false);
    setForm({});
    fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (demoBlock()) return;
    const { error } = await supabase.from("estoque").delete().eq("id", id);
    if (error) toast.error("Erro ao excluir");
    else { toast.success("Produto excluído!"); fetchProducts(); }
  };

  const restock = (f: Partial<Produto>) => {
    const cur = f.quantidade || 0;
    const min = f.quantidade_minima || 0;
    return cur >= min ? 0 : min - cur;
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando estoque...</p></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-foreground">Estoque</h2>
          <p className="text-muted-foreground text-xs sm:text-sm">Controle de materiais</p>
        </div>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={openNew}><Plus className="w-3.5 h-3.5 mr-1" /> Novo Produto</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <Package className="w-4 h-4 text-primary flex-shrink-0" />
          <div><p className="text-lg font-bold text-foreground">{products.length}</p><p className="text-xs text-muted-foreground">Total Produtos</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <Package className="w-4 h-4 text-primary flex-shrink-0" />
          <div><p className="text-sm sm:text-lg font-bold text-foreground">R$ {totalValue.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Valor Estoque</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0" />
          <div><p className="text-lg font-bold text-foreground">{belowMin.length}</p><p className="text-xs text-muted-foreground">Abaixo Mínimo</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-border">
              <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Produto</th>
              <th className="text-center p-2.5 text-muted-foreground font-medium text-xs">Qtd.</th>
              <th className="text-center p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Mín.</th>
              <th className="text-right p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Custo</th>
              <th className="text-center p-2.5 text-muted-foreground font-medium text-xs">Status</th>
              <th className="w-10"></th>
            </tr></thead>
            <tbody>
              {products.map(p => {
                const isLow = (p.quantidade || 0) < (p.quantidade_minima || 0);
                return (
                  <tr key={p.id} onClick={() => openEdit(p)} className="border-b border-border/50 hover:bg-secondary/50 transition-colors cursor-pointer">
                    <td className="p-2.5"><p className="font-medium text-foreground text-sm">{p.nome}</p>{p.marca && <p className="text-xs text-muted-foreground">{p.marca}</p>}</td>
                    <td className={cn("p-2.5 text-center font-semibold text-sm", isLow ? "text-destructive" : "text-foreground")}>{p.quantidade || 0}</td>
                    <td className="p-2.5 text-center text-muted-foreground text-xs hidden sm:table-cell">{p.quantidade_minima || 0}</td>
                    <td className="p-2.5 text-right text-muted-foreground text-xs hidden sm:table-cell">R$ {(p.preco_custo || 0).toFixed(2)}</td>
                    <td className="p-2.5 text-center"><Badge className={cn("border-0 text-xs", isLow ? "bg-destructive/15 text-destructive" : "bg-success/15 text-success")}>{isLow ? "Baixo" : "OK"}</Badge></td>
                    <td className="p-2.5"><Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); deleteProduct(p.id); }}><Trash2 className="w-3 h-3" /></Button></td>
                  </tr>
                );
              })}
              {products.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground text-sm">Nenhum produto cadastrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>

      <Dialog open={!!editProduct || newProduct} onOpenChange={() => { setEditProduct(null); setNewProduct(false); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editProduct ? "Editar Produto" : "Cadastrar Produto"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Unidade</Label><Input value={form.unidade || ""} onChange={e => setForm({ ...form, unidade: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Marca</Label><Input value={form.marca || ""} onChange={e => setForm({ ...form, marca: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Qtd. Atual</Label><Input type="number" value={form.quantidade ?? ""} onChange={e => setForm({ ...form, quantidade: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Qtd. Mínima</Label><Input type="number" value={form.quantidade_minima ?? ""} onChange={e => setForm({ ...form, quantidade_minima: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço de Custo</Label><Input type="number" value={form.preco_custo ?? ""} onChange={e => setForm({ ...form, preco_custo: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Fornecedor</Label><Input value={form.fornecedor || ""} onChange={e => setForm({ ...form, fornecedor: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2 p-3 rounded-lg bg-primary/5 border border-primary/10">
              <p className="text-xs text-muted-foreground">Reposição Sugerida</p>
              <p className="text-lg font-bold text-primary">{restock(form)} unidades</p>
            </div>
          </div>
          <Button onClick={saveProduct} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Produto"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
