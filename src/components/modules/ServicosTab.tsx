import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoServicos } from "@/data/demoData";
import { Plus, Scissors, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface Servico {
  id: string;
  nome: string;
  duracao: number | null;
  preco: number | null;
  descricao: string | null;
  ativo: boolean | null;
  user_id: string;
}

export default function ServicosTab() {
  const { user, isDemo } = useAuth();
  const [services, setServices] = useState<Servico[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Servico | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [form, setForm] = useState<Partial<Servico>>({});
  const [saving, setSaving] = useState(false);

  const fetchServices = async () => {
    if (isDemo) { setServices(demoServicos as Servico[]); setLoading(false); return; }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("servicos").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar serviços");
    else setServices(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchServices(); }, [user, isDemo]);

  const demoBlock = () => { if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return true; } return false; };

  const openNew = () => { setIsNew(true); setForm({ nome: "", duracao: 60, preco: 0, descricao: "", ativo: true }); };
  const openEdit = (s: Servico) => { setEditing(s); setForm({ ...s }); };

  const save = async () => {
    if (!form.nome?.trim()) { toast.error("Nome é obrigatório"); return; }
    if (demoBlock()) { setEditing(null); setIsNew(false); setForm({}); return; }
    if (!user) return;
    setSaving(true);
    if (editing) {
      const { error } = await supabase.from("servicos").update({ nome: form.nome, duracao: form.duracao, preco: form.preco, descricao: form.descricao, ativo: form.ativo }).eq("id", editing.id);
      if (error) { toast.error("Erro ao atualizar"); setSaving(false); return; }
      toast.success("Serviço atualizado!");
    } else {
      const { error } = await supabase.from("servicos").insert({ nome: form.nome!, duracao: form.duracao, preco: form.preco, descricao: form.descricao, ativo: form.ativo, user_id: user.id });
      if (error) { toast.error("Erro ao criar"); setSaving(false); return; }
      toast.success("Serviço criado!");
    }
    setSaving(false);
    setEditing(null); setIsNew(false); setForm({});
    fetchServices();
  };

  const remove = async (id: string) => {
    if (demoBlock()) return;
    const { error } = await supabase.from("servicos").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Serviço excluído!");
    fetchServices();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando serviços...</p></div>;

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
                <h3 className="font-semibold text-foreground text-sm">{s.nome}</h3>
              </div>
              <Button size="icon" variant="ghost" className="h-6 w-6 text-muted-foreground hover:text-destructive" onClick={e => { e.stopPropagation(); remove(s.id); }}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-base font-bold text-foreground">R$ {(s.preco || 0).toFixed(0)}</span>
              <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{s.duracao || 60}min</span>
            </div>
            <div className="flex items-center gap-1.5 mt-2">
              <Badge className={cn("text-[10px] border-0 px-1.5 py-0", s.ativo ? "bg-success/15 text-success" : "bg-muted text-muted-foreground")}>{s.ativo ? "Ativo" : "Inativo"}</Badge>
            </div>
          </div>
        ))}
        {services.length === 0 && <p className="text-muted-foreground text-sm col-span-full text-center py-6">Nenhum serviço cadastrado.</p>}
      </div>

      <Dialog open={!!editing || isNew} onOpenChange={() => { setEditing(null); setIsNew(false); }}>
        <DialogContent className="max-w-md bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar Serviço" : "Novo Serviço"}</DialogTitle></DialogHeader>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Nome</Label><Input value={form.nome || ""} onChange={e => setForm({ ...form, nome: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Duração (min)</Label><Input type="number" value={form.duracao ?? ""} onChange={e => setForm({ ...form, duracao: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Preço (R$)</Label><Input type="number" value={form.preco ?? ""} onChange={e => setForm({ ...form, preco: Number(e.target.value) })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2"><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={form.descricao || ""} onChange={e => setForm({ ...form, descricao: e.target.value })} className="bg-secondary border-border mt-1" /></div>
            <div className="col-span-2 flex items-center justify-between p-2.5 rounded-lg bg-secondary/50">
              <Label className="text-sm text-foreground">Ativo</Label>
              <Switch checked={form.ativo ?? true} onCheckedChange={v => setForm({ ...form, ativo: v })} />
            </div>
          </div>
          <Button onClick={save} disabled={saving} className="w-full mt-3 gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar Serviço"}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
