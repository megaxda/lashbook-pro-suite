import { Calendar, DollarSign, Package, Users, Clock, AlertTriangle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { mockAppointments, mockTransactions, mockProducts, mockClients } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const chartData = [
  { name: "Jan", receita: 4200 },
  { name: "Fev", receita: 5100 },
  { name: "Mar", receita: 6800 },
  { name: "Abr", receita: 3900 },
];

const today = "2026-04-13";
const todayAppointments = mockAppointments.filter(a => a.date === today);
const monthRevenue = mockTransactions.filter(t => t.type === "receita" && t.date.startsWith("2026-04")).reduce((s, t) => s + t.amount, 0);
const lowStock = mockProducts.filter(p => p.currentQuantity < p.minIdealQuantity);

// Follow-up: clients who haven't returned in 21+ days and have no future appointment
const todayDate = new Date(today);
const followUpClients = mockClients.filter(c => {
  const daysSince = Math.floor((todayDate.getTime() - new Date(c.lastVisit).getTime()) / 86400000);
  const hasFuture = mockAppointments.some(a => a.clientId === c.id && new Date(a.date) >= todayDate);
  return daysSince > 21 && !hasFuture;
});

export default function DashboardTab() {
  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bem-vinda, Julia! ✨</h2>
        <p className="text-muted-foreground mt-1">Resumo do seu dia.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard icon={Calendar} title="Agenda Hoje" value={todayAppointments.length} subtitle="agendamentos" />
        <StatCard icon={DollarSign} title="Receita Mês" value={`R$ ${monthRevenue.toLocaleString("pt-BR")}`} />
        <StatCard icon={Package} title="Estoque Baixo" value={lowStock.length} subtitle="itens" />
        <StatCard icon={Users} title="Follow-up" value={followUpClients.length} subtitle="pendentes" />
      </div>

      <div className="gradient-card rounded-xl p-4 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-3">Receita Mensal</h3>
        <ResponsiveContainer width="100%" height={180}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }} />
            <Bar dataKey="receita" fill="hsl(330,85%,52%)" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="gradient-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Agendamentos Hoje</h3>
          {todayAppointments.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Nenhum agendamento hoje.</p>}
          <div className="space-y-2">
            {todayAppointments.map(a => (
              <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary hover:bg-secondary/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 rounded-full" style={{ background: a.status === "Confirmado" ? "hsl(145,63%,42%)" : "hsl(45,93%,47%)" }} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{a.clientName}</p>
                    <p className="text-xs text-muted-foreground">{a.service}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-foreground">{a.time}</p>
                  <p className="text-xs text-muted-foreground">{a.duration}min</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="gradient-card rounded-xl p-4 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas</h3>
          <div className="space-y-2">
            {lowStock.map(p => (
              <div key={p.id} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10">
                <div>
                  <p className="text-sm font-medium text-foreground">{p.name}</p>
                  <p className="text-xs text-muted-foreground">Estoque: {p.currentQuantity}/{p.minIdealQuantity}</p>
                </div>
                <Badge className="bg-destructive/15 text-destructive border-0 text-[10px]">Baixo</Badge>
              </div>
            ))}
            {followUpClients.length > 0 && (
              <div className="p-3 rounded-lg bg-warning/5 border border-warning/10">
                <p className="text-sm font-medium text-foreground">Follow-up pendente</p>
                <p className="text-xs text-muted-foreground">{followUpClients.length} clientes sem retorno há mais de 21 dias</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
