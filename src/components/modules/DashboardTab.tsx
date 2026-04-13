import { Calendar, DollarSign, Package, Users, Clock, AlertTriangle } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { mockAppointments, mockTransactions, mockProducts, mockClients } from "@/data/mockData";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from "recharts";
import { useNavigate } from "react-router-dom";

const chartData = [
  { name: "Jan", receita: 4200, agendamentos: 18 },
  { name: "Fev", receita: 5100, agendamentos: 22 },
  { name: "Mar", receita: 6800, agendamentos: 28 },
  { name: "Abr", receita: 3900, agendamentos: 15 },
];

const todayAppointments = mockAppointments.filter(a => a.date === "2026-04-11");
const monthRevenue = mockTransactions.filter(t => t.type === "receita" && t.date.startsWith("2026-04")).reduce((s, t) => s + t.amount, 0);
const lowStock = mockProducts.filter(p => p.currentQuantity < p.minIdealQuantity);
const followUpClients = mockClients.filter(c => {
  const daysSince = Math.floor((new Date("2026-04-13").getTime() - new Date(c.lastVisit).getTime()) / 86400000);
  return daysSince > 21;
});

export default function DashboardTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bem-vinda! ✨</h2>
        <p className="text-muted-foreground mt-1">Aqui está o resumo do seu dia.</p>
      </div>

      {/* Alerts section */}
      <div className="gradient-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-warning" /> Alertas</h3>
        <div className="space-y-3">
          {lowStock.map(p => (
            <div key={p.id} onClick={() => navigate("/home_profissional?tab=Estoque")} className="flex items-center justify-between p-3 rounded-lg bg-destructive/5 border border-destructive/10 cursor-pointer hover:bg-destructive/10 transition-colors">
              <div>
                <p className="text-sm font-medium text-foreground">{p.name}</p>
                <p className="text-xs text-muted-foreground">Estoque: {p.currentQuantity} / Mín: {p.minIdealQuantity}</p>
              </div>
              <span className="text-xs font-semibold px-2 py-1 rounded-full bg-destructive/15 text-destructive">Baixo</span>
            </div>
          ))}
          {followUpClients.length > 0 && (
            <div onClick={() => navigate("/home_profissional?tab=Clientes")} className="p-3 rounded-lg bg-warning/5 border border-warning/10 cursor-pointer hover:bg-warning/10 transition-colors">
              <p className="text-sm font-medium text-foreground">Follow-up pendente</p>
              <p className="text-xs text-muted-foreground">{followUpClients.length} clientes sem retorno há mais de 21 dias</p>
            </div>
          )}
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="gradient-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Agendamentos por Mês</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff" }} />
              <Line type="monotone" dataKey="agendamentos" stroke="hsl(197,68%,44%)" strokeWidth={2} dot={{ fill: "hsl(197,68%,44%)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="gradient-card rounded-xl p-5 border border-border">
          <h3 className="text-sm font-semibold text-foreground mb-4">Receita Mensal</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(0,0%,18%)" />
              <XAxis dataKey="name" stroke="hsl(0,0%,45%)" fontSize={12} />
              <YAxis stroke="hsl(0,0%,45%)" fontSize={12} />
              <Tooltip contentStyle={{ background: "hsl(0,0%,12%)", border: "1px solid hsl(0,0%,20%)", borderRadius: 8, color: "#fff" }} />
              <Bar dataKey="receita" fill="hsl(197,68%,44%)" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Calendar} title="Agenda Hoje" value={todayAppointments.length} subtitle="agendamentos" trend={{ value: "+2", positive: true }} />
        <StatCard icon={DollarSign} title="Receita do Mês" value={`R$ ${monthRevenue.toLocaleString("pt-BR")}`} trend={{ value: "+12%", positive: true }} />
        <StatCard icon={Package} title="Alertas de Estoque" value={lowStock.length} subtitle="itens abaixo do mínimo" />
        <StatCard icon={Users} title="Clientes Ativos" value={6} trend={{ value: "+3", positive: true }} />
      </div>

      {/* Upcoming appointments */}
      <div className="gradient-card rounded-xl p-5 border border-border">
        <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2"><Clock className="w-4 h-4 text-primary" /> Próximos Agendamentos</h3>
        <div className="space-y-3">
          {todayAppointments.map(a => (
            <div key={a.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
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
    </div>
  );
}
