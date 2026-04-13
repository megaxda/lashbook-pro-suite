import { useState } from "react";
import { useFinanceiro } from "@/hooks/useSupabaseData";
import type { Transaction } from "@/data/mockData";import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Plus } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Transaction } from "@/data/mockData";

export default function FinanceiroTab() {
  const { transacoes, isLoading: isLoadingTransacoes } = useFinanceiro();
  const [transactions, setTransactions] = useState(transacoes);  const [newDespesa, setNewDespesa] = useState({ description: "", amount: "", date: "", category: "Material" });
  const [newReceita, setNewReceita] = useState({ description: "", amount: "", date: "", paymentMethod: "PIX" });
  const [despesaOpen, setDespesaOpen] = useState(false);
  const [receitaOpen, setReceitaOpen] = useState(false);

  const receitas = transactions.filter(t => t.type === "receita");
  const despesas = transactions.filter(t => t.type === "despesa");
  const totalReceita = receitas.reduce((s, t) => s + t.amount, 0);
  const totalDespesa = despesas.reduce((s, t) => s + t.amount, 0);
  const lucro = totalReceita - totalDespesa;
  const ticketMedio = receitas.length ? totalReceita / receitas.length : 0;

  const pieData = [
    { name: "Serviços", value: totalReceita, color: "hsl(330,85%,52%)" },
    { name: "Material", value: despesas.filter(d => d.category === "Material").reduce((s, d) => s + d.amount, 0), color: "hsl(340,60%,65%)" },
    { name: "Fixas", value: despesas.filter(d => d.category === "Fixas").reduce((s, d) => s + d.amount, 0), color: "hsl(0,0%,45%)" },
  ];

  const addDespesa = () => {
    const t: Transaction = { id: String(Date.now()), type: "despesa", description: newDespesa.description, amount: Number(newDespesa.amount), date: newDespesa.date || new Date().toISOString().slice(0, 10), category: newDespesa.category, paymentMethod: "PIX" };
    setTransactions(prev => [t, ...prev]);
    setNewDespesa({ description: "", amount: "", date: "", category: "Material" });
    setDespesaOpen(false);
  };

  const addReceita = () => {
    const t: Transaction = { id: String(Date.now()), type: "receita", description: newReceita.description, amount: Number(newReceita.amount), date: newReceita.date || new Date().toISOString().slice(0, 10), category: "Manual", paymentMethod: newReceita.paymentMethod };
    setTransactions(prev => [t, ...prev]);
    setNewReceita({ description: "", amount: "", date: "", paymentMethod: "PIX" });
    setReceitaOpen(false);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>
        <div className="flex gap-2">
          <Dialog open={receitaOpen} onOpenChange={setReceitaOpen}>
            <DialogTrigger asChild><Button size="sm" className="gradient-pink text-primary-foreground"><Plus className="w-4 h-4 mr-1" /> Receita</Button></DialogTrigger>
            <DialogContent className="max-w-sm bg-card border-border">
              <DialogHeader><DialogTitle>Lançar Receita</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={newReceita.description} onChange={e => setNewReceita(p => ({...p, description: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Valor (R$)</Label><Input type="number" value={newReceita.amount} onChange={e => setNewReceita(p => ({...p, amount: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Data</Label><Input type="date" value={newReceita.date} onChange={e => setNewReceita(p => ({...p, date: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Pagamento</Label>
                  <Select value={newReceita.paymentMethod} onValueChange={v => setNewReceita(p => ({...p, paymentMethod: v}))}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="PIX">PIX</SelectItem><SelectItem value="Dinheiro">Dinheiro</SelectItem><SelectItem value="Cartão">Cartão</SelectItem></SelectContent>
                  </Select></div>
              </div>
              <DialogFooter><Button onClick={addReceita} className="gradient-pink text-primary-foreground">Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={despesaOpen} onOpenChange={setDespesaOpen}>
            <DialogTrigger asChild><Button size="sm" variant="outline"><Plus className="w-4 h-4 mr-1" /> Despesa</Button></DialogTrigger>
            <DialogContent className="max-w-sm bg-card border-border">
              <DialogHeader><DialogTitle>Lançar Despesa</DialogTitle></DialogHeader>
              <div className="space-y-3 mt-2">
                <div><Label className="text-xs text-muted-foreground">Descrição</Label><Input value={newDespesa.description} onChange={e => setNewDespesa(p => ({...p, description: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Valor (R$)</Label><Input type="number" value={newDespesa.amount} onChange={e => setNewDespesa(p => ({...p, amount: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Data</Label><Input type="date" value={newDespesa.date} onChange={e => setNewDespesa(p => ({...p, date: e.target.value}))} className="bg-secondary border-border mt-1" /></div>
                <div><Label className="text-xs text-muted-foreground">Categoria</Label>
                  <Select value={newDespesa.category} onValueChange={v => setNewDespesa(p => ({...p, category: v}))}>
                    <SelectTrigger className="bg-secondary border-border mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-card border-border"><SelectItem value="Material">Material</SelectItem><SelectItem value="Fixas">Fixas</SelectItem><SelectItem value="Outros">Outros</SelectItem></SelectContent>
                  </Select></div>
              </div>
              <DialogFooter><Button onClick={addDespesa}>Salvar</Button></DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={TrendingUp} title="Receita" value={`R$ ${totalReceita.toLocaleString("pt-BR")}`} trend={{ value: "+15%", positive: true }} />
        <StatCard icon={TrendingDown} title="Despesas" value={`R$ ${totalDespesa.toLocaleString("pt-BR")}`} />
        <StatCard icon={DollarSign} title="Lucro" value={`R$ ${lucro.toLocaleString("pt-BR")}`} trend={{ value: lucro > 0 ? "Positivo" : "Negativo", positive: lucro > 0 }} />
        <StatCard icon={ArrowUpDown} title="Ticket Médio" value={`R$ ${ticketMedio.toFixed(0)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="gradient-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Receita vs Despesas</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={[{ name: "Receitas", value: totalReceita }, { name: "Despesas", value: totalDespesa }]}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
              <Bar dataKey="value" fill="hsl(330,85%,52%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="gradient-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart><Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>{pieData.map((e, i) => <Cell key={i} fill={e.color} />)}</Pie>
              <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} /></PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">{pieData.map(p => (<div key={p.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} /><span className="text-xs text-muted-foreground">{p.name}</span></div>))}</div>
        </div>
      </div>

      <Tabs defaultValue="receitas">
        <TabsList className="bg-secondary"><TabsTrigger value="receitas">Receitas</TabsTrigger><TabsTrigger value="despesas">Despesas</TabsTrigger></TabsList>
        <TabsContent value="receitas">
          <div className="gradient-card rounded-xl border border-border overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="text-left p-3 text-muted-foreground font-medium">Descrição</th><th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Data</th><th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Pagamento</th><th className="text-right p-3 text-muted-foreground font-medium">Valor</th></tr></thead>
                <tbody>{receitas.map(t => (<tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50"><td className="p-3 text-foreground">{t.description}</td><td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td><td className="p-3 text-muted-foreground hidden md:table-cell">{t.paymentMethod}</td><td className="p-3 text-right font-semibold text-success">+R$ {t.amount.toLocaleString("pt-BR")}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </TabsContent>
        <TabsContent value="despesas">
          <div className="gradient-card rounded-xl border border-border overflow-hidden mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-border"><th className="text-left p-3 text-muted-foreground font-medium">Descrição</th><th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Data</th><th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Categoria</th><th className="text-right p-3 text-muted-foreground font-medium">Valor</th></tr></thead>
                <tbody>{despesas.map(t => (<tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50"><td className="p-3 text-foreground">{t.description}</td><td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td><td className="p-3 text-muted-foreground hidden md:table-cell">{t.category}</td><td className="p-3 text-right font-semibold text-destructive">-R$ {t.amount.toLocaleString("pt-BR")}</td></tr>))}</tbody>
              </table>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
