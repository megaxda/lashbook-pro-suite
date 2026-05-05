import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { demoFinanceiro } from "@/data/demoData";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";

interface Transacao {
  id: string;
  tipo: string;
  descricao: string | null;
  valor: number;
  data: string;
  categoria: string | null;
  user_id: string;
}

export default function FinanceiroTab() {
  const { user, isDemo } = useAuth();
  const [transactions, setTransactions] = useState<Transacao[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newType, setNewType] = useState<"receita" | "despesa">("despesa");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("");

  const fetchTransactions = async () => {
    if (isDemo) { setTransactions(demoFinanceiro as Transacao[]); setLoading(false); return; }
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase.from("financeiro").select("*").eq("user_id", user.id).order("data", { ascending: false });
    if (error) toast.error("Erro ao carregar financeiro");
    else setTransactions(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchTransactions(); }, [user, isDemo]);

  const receitas = transactions.filter(t => t.tipo === "receita");
  const despesas = transactions.filter(t => t.tipo === "despesa");
  const totalReceita = receitas.reduce((s, t) => s + t.valor, 0);
  const totalDespesa = despesas.reduce((s, t) => s + t.valor, 0);
  const lucro = totalReceita - totalDespesa;
  const ticketMedio = receitas.length ? totalReceita / receitas.length : 0;

  const pieData = [
    { name: "Receitas", value: totalReceita, color: "hsl(0,76%,42%)" },
    { name: "Despesas", value: totalDespesa, color: "hsl(0,0%,35%)" },
  ];

  const addTransaction = async () => {
    if (!newDesc || !newAmount || !newDate) { toast.error("Preencha todos os campos"); return; }
    if (isDemo) { toast.info("Modo Demo: alterações não são salvas."); setDialogOpen(false); return; }
    if (!user) return;
    setSaving(true);
    const { error } = await supabase.from("financeiro").insert({
      user_id: user.id, tipo: newType, descricao: newDesc, valor: parseFloat(newAmount), data: newDate, categoria: newCategory || null,
    });
    setSaving(false);
    if (error) { toast.error("Erro ao salvar"); return; }
    toast.success("Transação salva!");
    setNewDesc(""); setNewAmount(""); setNewDate(""); setNewCategory("");
    setDialogOpen(false);
    fetchTransactions();
  };

  if (loading) return <div className="flex items-center justify-center py-12"><p className="text-muted-foreground">Carregando financeiro...</p></div>;

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h2>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Entrada</Button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {totalReceita.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Receita Total</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {totalDespesa.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Despesas</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {lucro.toLocaleString("pt-BR")}</p><p className="text-xs text-muted-foreground">Lucro</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <ArrowUpDown className="w-4 h-4 text-info flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {ticketMedio.toFixed(0)}</p><p className="text-xs text-muted-foreground">Ticket Médio</p></div>
        </div>
      </div>

      <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Distribuição</h3>
        <ResponsiveContainer width="100%" height={180}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
              {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
            </Pie>
            <Tooltip contentStyle={{ background: "#fff", border: "1px solid #e5e5e5", borderRadius: 8, fontSize: 12 }} />
          </PieChart>
        </ResponsiveContainer>
        <div className="flex justify-center gap-4 mt-2">
          {pieData.map(p => (
            <div key={p.name} className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full" style={{ background: p.color }} /><span className="text-xs text-muted-foreground">{p.name}</span></div>
          ))}
        </div>
      </div>

      <Tabs defaultValue="receitas">
        <TabsList className="bg-secondary h-8"><TabsTrigger value="receitas" className="text-xs h-7">Receitas</TabsTrigger><TabsTrigger value="despesas" className="text-xs h-7">Despesas</TabsTrigger></TabsList>
        <TabsContent value="receitas">
          <div className="bg-card rounded-xl border border-border overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Descrição</th>
                <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Data</th>
                <th className="text-right p-2.5 text-muted-foreground font-medium text-xs">Valor</th>
              </tr></thead>
              <tbody>{receitas.length === 0 ? <tr><td colSpan={3} className="p-4 text-center text-muted-foreground text-sm">Nenhuma receita.</td></tr> : receitas.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-2.5 text-foreground text-sm">{t.descricao || "—"}</td>
                  <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{new Date(t.data + "T12:00").toLocaleDateString("pt-BR")}</td>
                  <td className="p-2.5 text-right font-semibold text-success text-sm">+R$ {t.valor.toLocaleString("pt-BR")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="despesas">
          <div className="bg-card rounded-xl border border-border overflow-hidden mt-3">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-2.5 text-muted-foreground font-medium text-xs">Descrição</th>
                <th className="text-left p-2.5 text-muted-foreground font-medium text-xs hidden sm:table-cell">Data</th>
                <th className="text-right p-2.5 text-muted-foreground font-medium text-xs">Valor</th>
              </tr></thead>
              <tbody>{despesas.length === 0 ? <tr><td colSpan={3} className="p-4 text-center text-muted-foreground text-sm">Nenhuma despesa.</td></tr> : despesas.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-2.5 text-foreground text-sm">{t.descricao || "—"}</td>
                  <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{new Date(t.data + "T12:00").toLocaleDateString("pt-BR")}</td>
                  <td className="p-2.5 text-right font-semibold text-destructive text-sm">-R$ {t.valor.toLocaleString("pt-BR")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm bg-card border-border">
          <DialogHeader><DialogTitle className="text-foreground">Nova Transação</DialogTitle></DialogHeader>
          <div className="space-y-3 mt-2">
            <div><Label className="text-muted-foreground text-xs">Tipo</Label>
              <Select value={newType} onValueChange={v => setNewType(v as any)}>
                <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                <SelectContent className="bg-card border-border"><SelectItem value="receita">Receita</SelectItem><SelectItem value="despesa">Despesa</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-muted-foreground text-xs">Descrição</Label><Input value={newDesc} onChange={e => setNewDesc(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Valor (R$)</Label><Input type="number" value={newAmount} onChange={e => setNewAmount(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Data</Label><Input type="date" value={newDate} onChange={e => setNewDate(e.target.value)} className="bg-secondary border-border mt-1" /></div>
            <div><Label className="text-muted-foreground text-xs">Categoria</Label><Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="Material, Fixas, Serviços" className="bg-secondary border-border mt-1" /></div>
            <Button onClick={addTransaction} disabled={saving} className="w-full gradient-brand text-primary-foreground">{saving ? "Salvando..." : "Salvar"}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
