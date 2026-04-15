import { useState } from "react";
import { mockTransactions, Transaction } from "@/data/mockData";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function FinanceiroTab() {
  const [transactions, setTransactions] = useState<Transaction[]>([...mockTransactions]);
  const [newType, setNewType] = useState<"receita" | "despesa">("despesa");
  const [newDesc, setNewDesc] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [newPayment, setNewPayment] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  const receitas = transactions.filter(t => t.type === "receita");
  const despesas = transactions.filter(t => t.type === "despesa");
  const totalReceita = receitas.reduce((s, t) => s + t.amount, 0);
  const totalDespesa = despesas.reduce((s, t) => s + t.amount, 0);
  const lucro = totalReceita - totalDespesa;
  const ticketMedio = receitas.length ? totalReceita / receitas.length : 0;

  const pieData = [
    { name: "Serviços", value: totalReceita, color: "hsl(0,76%,42%)" },
    { name: "Material", value: despesas.filter(d => d.category === "Material").reduce((s, t) => s + t.amount, 0), color: "hsl(0,60%,55%)" },
    { name: "Fixas", value: despesas.filter(d => d.category === "Fixas").reduce((s, t) => s + t.amount, 0), color: "hsl(0,0%,35%)" },
  ];

  const barData = [
    { name: "Sem 1", receita: 630, despesa: 1800 },
    { name: "Sem 2", receita: 1080, despesa: 618 },
    { name: "Sem 3", receita: 350, despesa: 0 },
  ];

  const addTransaction = () => {
    if (!newDesc || !newAmount || !newDate) return;
    const t: Transaction = { id: String(Date.now()), type: newType, description: newDesc, amount: parseFloat(newAmount), date: newDate, category: newCategory || (newType === "receita" ? "Serviços" : "Outros"), paymentMethod: newPayment || "PIX" };
    setTransactions(prev => [t, ...prev]);
    setNewDesc(""); setNewAmount(""); setNewDate(""); setNewCategory(""); setNewPayment("");
    setDialogOpen(false);
  };

  return (
    <div className="space-y-4 sm:space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h2 className="text-xl sm:text-2xl font-bold text-foreground">Financeiro</h2>
        <Button size="sm" className="gradient-brand text-primary-foreground h-8 text-xs" onClick={() => setDialogOpen(true)}><Plus className="w-3.5 h-3.5 mr-1" /> Nova Entrada</Button>
      </div>

      {/* Pills - 2 per row on mobile */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <TrendingUp className="w-4 h-4 text-success flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {totalReceita.toLocaleString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">Receita Total</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <TrendingDown className="w-4 h-4 text-destructive flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {totalDespesa.toLocaleString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">Despesas</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <DollarSign className="w-4 h-4 text-primary flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {lucro.toLocaleString("pt-BR")}</p><p className="text-[10px] text-muted-foreground">Lucro</p></div>
        </div>
        <div className="flex items-center gap-2 p-3 rounded-xl bg-card border border-border">
          <ArrowUpDown className="w-4 h-4 text-info flex-shrink-0" />
          <div className="min-w-0"><p className="text-sm sm:text-lg font-bold text-foreground">R$ {ticketMedio.toFixed(0)}</p><p className="text-[10px] text-muted-foreground">Ticket Médio</p></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-4">
        <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Receita vs Despesas</h3>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(40,4%,24%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={11} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={11} />
              <Tooltip contentStyle={{ background: "hsl(40,4%,18%)", border: "1px solid hsl(40,4%,24%)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
              <Bar dataKey="receita" fill="hsl(0,76%,42%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="hsl(0,0%,35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card rounded-xl p-4 sm:p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(40,4%,18%)", border: "1px solid hsl(40,4%,24%)", borderRadius: 8, color: "#fff", fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                <span className="text-[10px] text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
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
              <tbody>{transactions.filter(t => t.type === "receita").map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-2.5 text-foreground text-sm">{t.description}</td>
                  <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-2.5 text-right font-semibold text-success text-sm">+R$ {t.amount.toLocaleString("pt-BR")}</td>
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
              <tbody>{transactions.filter(t => t.type === "despesa").map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-2.5 text-foreground text-sm">{t.description}</td>
                  <td className="p-2.5 text-muted-foreground text-xs hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-2.5 text-right font-semibold text-destructive text-sm">-R$ {t.amount.toLocaleString("pt-BR")}</td>
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
            <Button onClick={addTransaction} className="w-full gradient-brand text-primary-foreground">Salvar</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
