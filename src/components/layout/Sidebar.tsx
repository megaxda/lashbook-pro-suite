import { NavLink } from "react-router-dom";
import { Home, Users, DollarSign, Calendar, Package, Scissors, FileText, HelpCircle, User } from "lucide-react";
import { cn } from "@/lib/utils";

const menuItems = [
  { label: "Início", icon: Home, path: "/home_profissional" },
  { label: "Clientes", icon: Users, path: "/home_profissional?tab=Clientes" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional?tab=Financeiro" },
  { label: "Conta", icon: User, path: "/account" },
];

const moreItems = [
  { label: "Agendamentos", icon: Calendar, path: "/home_profissional?tab=Agendamentos" },
  { label: "Estoque", icon: Package, path: "/home_profissional?tab=Estoque" },
  { label: "Serviços", icon: Scissors, path: "/home_profissional?tab=Servicos" },
  { label: "Fichas", icon: FileText, path: "/home_profissional?tab=Fichas" },
];

export default function Sidebar() {
  return (
    <aside className="hidden lg:flex flex-col w-64 h-screen bg-card border-r border-border fixed left-0 top-0">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg gradient-pink flex items-center justify-center">
            <span className="text-primary-foreground text-sm font-bold">LB</span>
          </div>
          <h1 className="text-lg font-bold text-foreground tracking-tight">LASH BOOK</h1>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        <div className="space-y-1">
          {menuItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>

        {/* More Items */}
        <div className="pt-4">
          <p className="px-4 text-xs font-semibold text-muted-foreground mb-2">MAIS</p>
          <div className="space-y-1">
            {moreItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                    isActive
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                  )
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground truncate">Julia</p>
          <p className="text-xs text-muted-foreground">Profissional</p>
        </div>
      </div>
    </aside>
  );
}
