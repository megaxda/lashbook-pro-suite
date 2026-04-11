import { Shield, Users, CreditCard, BarChart3 } from "lucide-react";
import StatCard from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/badge";

const mockUsers = [
  { id: "1", name: "Julia Soares", email: "julia@lashbook.com", plan: "Pro", status: "Ativo", joined: "2025-11-01" },
  { id: "2", name: "Amanda Torres", email: "amanda@email.com", plan: "Básico", status: "Ativo", joined: "2026-01-15" },
  { id: "3", name: "Renata Dias", email: "renata@email.com", plan: "Pro", status: "Ativo", joined: "2026-02-20" },
  { id: "4", name: "Carla Nunes", email: "carla@email.com", plan: "Pro", status: "Inativo", joined: "2025-08-10" },
];

export default function AdminPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 rounded-lg gradient-pink"><Shield className="w-5 h-5 text-primary-foreground" /></div>
        <div>
          <h2 className="text-2xl font-bold text-foreground">Painel Admin</h2>
          <p className="text-sm text-muted-foreground">Gestão da plataforma LASH BOOK</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Users} title="Usuários" value={4} trend={{ value: "+12%", positive: true }} />
        <StatCard icon={CreditCard} title="Assinantes Pro" value={3} />
        <StatCard icon={BarChart3} title="Receita Plataforma" value="R$ 199" />
        <StatCard icon={Users} title="Novos (mês)" value={1} />
      </div>

      <div className="gradient-card rounded-xl border border-border overflow-hidden">
        <div className="p-4 border-b border-border"><h3 className="font-semibold text-foreground">Usuários / Profissionais</h3></div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border">
            <th className="text-left p-3 text-muted-foreground font-medium">Nome</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden sm:table-cell">Email</th>
            <th className="text-left p-3 text-muted-foreground font-medium">Plano</th>
            <th className="text-left p-3 text-muted-foreground font-medium hidden md:table-cell">Cadastro</th>
            <th className="text-left p-3 text-muted-foreground font-medium">Status</th>
          </tr></thead>
          <tbody>
            {mockUsers.map(u => (
              <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/50">
                <td className="p-3 font-medium text-foreground">{u.name}</td>
                <td className="p-3 text-muted-foreground hidden sm:table-cell">{u.email}</td>
                <td className="p-3"><Badge className={u.plan === "Pro" ? "bg-primary/15 text-primary border-0" : "bg-muted text-muted-foreground border-0"}>{u.plan}</Badge></td>
                <td className="p-3 text-muted-foreground hidden md:table-cell">{new Date(u.joined).toLocaleDateString("pt-BR")}</td>
                <td className="p-3"><Badge className={u.status === "Ativo" ? "bg-success/15 text-success border-0" : "bg-muted text-muted-foreground border-0"}>{u.status}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
