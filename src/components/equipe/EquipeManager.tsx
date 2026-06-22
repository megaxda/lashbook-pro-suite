import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Users } from "lucide-react";
import { toast } from "sonner";

export interface Profissional {
  id: string;
  nome: string;
  cor: string | null;
  ativo: boolean;
}

const DEFAULT_COLORS = ["#ec4899", "#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export default function EquipeManager() {
  const { user, isDemo } = useAuth();
  const [list, setList] = useState<Profissional[]>([]);
  const [novoNome, setNovoNome] = useState("");
  const [novaCor, setNovaCor] = useState(DEFAULT_COLORS[0]);
  const [loading, setLoading] = useState(true);

  const fetchList = async () => {
    if (isDemo || !user) { setList([]); setLoading(false); return; }
    const { data, error } = await (supabase as any)
      .from("profissionais")
      .select("id, nome, cor, ativo")
      .eq("user_id", user.id)
      .order("nome");
    if (error) toast.error("Erro ao carregar equipe");
    setList((data as Profissional[]) || []);
    setLoading(false);
  };
  useEffect(() => { fetchList(); /* eslint-disable-next-line */ }, [user, isDemo]);

  const add = async () => {
    if (!novoNome.trim()) { toast.error("Informe o nome"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); return; }
    if (!user) return;
    const { error } = await (supabase as any).from("profissionais").insert({
      user_id: user.id, nome: novoNome.trim(), cor: novaCor, ativo: true,
    });
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Profissional adicionada!");
    setNovoNome(""); setNovaCor(DEFAULT_COLORS[0]);
    fetchList();
  };

  const toggle = async (p: Profissional) => {
    if (isDemo) return;
    const { error } = await (supabase as any).from("profissionais").update({ ativo: !p.ativo }).eq("id", p.id);
    if (error) { toast.error("Erro"); return; }
    fetchList();
  };

  const remove = async (p: Profissional) => {
    if (isDemo) return;
    if (!confirm(`Excluir ${p.nome}? Os agendamentos existentes serão desvinculados.`)) return;
    const { error } = await (supabase as any).from("profissionais").delete().eq("id", p.id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Removida");
    fetchList();
  };

  const updateCor = async (p: Profissional, cor: string) => {
    if (isDemo) return;
    await (supabase as any).from("profissionais").update({ cor }).eq("id", p.id);
    fetchList();
  };

  return (
    <div className="bg-card rounded-xl p-4 sm:p-6 border border-border space-y-4">
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-primary" />
        <h3 className="font-semibold text-foreground text-sm">Equipe (Profissionais)</h3>
      </div>
      <p className="text-xs text-muted-foreground">Cadastre as profissionais do estúdio. Cada agendamento pode ser atribuído a uma profissional específica.</p>

      <div className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Carregando...</p>}
        {!loading && list.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma profissional cadastrada ainda.</p>}
        {list.map(p => (
          <div key={p.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-secondary/40 border border-border">
            <input
              type="color"
              value={p.cor || "#ec4899"}
              onChange={e => updateCor(p, e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer bg-transparent"
              title="Cor"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{p.nome}</p>
              <p className="text-[10px] text-muted-foreground">{p.ativo ? "Ativa" : "Inativa"}</p>
            </div>
            <Switch checked={p.ativo} onCheckedChange={() => toggle(p)} />
            <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => remove(p)}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        ))}
      </div>

      <div className="border-t border-border pt-3 space-y-2">
        <Label className="text-xs text-muted-foreground">Adicionar nova profissional</Label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={novaCor}
            onChange={e => setNovaCor(e.target.value)}
            className="w-9 h-9 rounded border border-border cursor-pointer bg-transparent shrink-0"
          />
          <Input
            value={novoNome}
            onChange={e => setNovoNome(e.target.value)}
            placeholder="Nome (ex: Carol, Rafa)"
            className="bg-secondary border-border flex-1"
            onKeyDown={e => { if (e.key === "Enter") add(); }}
          />
          <Button size="sm" onClick={add} className="gradient-brand text-primary-foreground shrink-0">
            <Plus className="w-3.5 h-3.5 mr-1" /> Adicionar
          </Button>
        </div>
      </div>
    </div>
  );
}
