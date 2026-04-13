import { useState } from "react";
import { mockTransactions } from "@/data/mockData";
import { DollarSign, TrendingUp, TrendingDown, ArrowUpDown } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from "recharts";

const receitas = mockTransactions.filter(t => t.type === "receita");
const despesas = mockTransactions.filter(t => t.type === "despesa");
const totalReceita = receitas.reduce((s, t) => s + t.amount, 0);
const totalDespesa = despesas.reduce((s, t) => s + t.amount, 0);
const lucro = totalReceita - totalDespesa;
const ticketMedio = receitas.length ? totalReceita / receitas.length : 0;

const pieData = [
  { name: "Serviços", value: totalReceita, color: "hsl(330,85%,52%)" },
  { name: "Material", value: 598, color: "hsl(340,60%,65%)" },
  { name: "Fixas", value: 2020, color: "hsl(0,0%,35%)" },
];

const barData = [
  { name: "Sem 1", receita: 630, despesa: 1800 },
  { name: "Sem 2", receita: 1080, despesa: 618 },
  { name: "Sem 3", receita: 350, despesa: 0 },
];

export default function FinanceiroTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <h2 className="text-2xl font-bold text-foreground">Financeiro</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={TrendingUp} title="Receita Total" value={`R$ ${totalReceita.toLocaleString("pt-BR")}`} trend={{ value: "+15%", positive: true }} />
        <StatCard icon={TrendingDown} title="Despesas" value={`R$ ${totalDespesa.toLocaleString("pt-BR")}`} />
        <StatCard icon={DollarSign} title="Lucro" value={`R$ ${lucro.toLocaleString("pt-BR")}`} trend={{ value: lucro > 0 ? "Positivo" : "Negativo", positive: lucro > 0 }} />
        <StatCard icon={ArrowUpDown} title="Ticket Médio" value={`R$ ${ticketMedio.toFixed(0)}`} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="gradient-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita vs Despesas</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={barData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="receita" fill="hsl(330,85%,52%)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="despesa" fill="hsl(0,0%,35%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="gradient-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Despesas por Categoria</h3>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" paddingAngle={3}>
                {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff" }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {pieData.map(p => (
              <div key={p.name} className="flex items-center gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full" style={{ background: p.color }} />
                <span className="text-xs text-muted-foreground">{p.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Tabs defaultValue="receitas">
        <TabsList className="bg-secondary"><TabsTrigger value="receitas">Receitas</TabsTrigger><TabsTrigger value="despesas">Despesas</TabsTrigger></TabsList>
        <TabsContent value="receitas">
          <div className="gradient-card rounded-xl border border-border overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Data</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Pagamento</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
              </tr></thead>
              <tbody>{receitas.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-3 text-foreground">{t.description}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{t.paymentMethod}</td>
                  <td className="p-3 text-right font-semibold text-success">+R$ {t.amount.toLocaleString("pt-BR")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
        <TabsContent value="despesas">
          <div className="gradient-card rounded-xl border border-border overflow-hidden mt-4">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-border">
                <th className="text-left p-3 text-muted-foreground font-medium">Descrição</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Data</th>
                <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Categoria</th>
                <th className="text-right p-3 text-muted-foreground font-medium">Valor</th>
              </tr></thead>
              <tbody>{despesas.map(t => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-secondary/50">
                  <td className="p-3 text-foreground">{t.description}</td>
                  <td className="p-3 text-muted-foreground hidden sm:table-cell">{new Date(t.date).toLocaleDateString("pt-BR")}</td>
                  <td className="p-3 text-muted-foreground hidden md:table-cell">{t.category}</td>
                  <td className="p-3 text-right font-semibold text-destructive">-R$ {t.amount.toLocaleString("pt-BR")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
