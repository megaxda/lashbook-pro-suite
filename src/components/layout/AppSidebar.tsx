import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home, Users, Calendar, DollarSign, Package, Scissors,
  FileText, HelpCircle, User, Shield, LogOut, ChevronLeft, ChevronRight, Menu, X, Sun, Moon
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { label: "Início", icon: Home, path: "/home_profissional", tab: undefined },
  { label: "Clientes", icon: Users, path: "/home_profissional", tab: "Clientes" },
  { label: "Agendamentos", icon: Calendar, path: "/home_profissional", tab: "Agendamentos" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional", tab: "Financeiro" },
  { label: "Estoque", icon: Package, path: "/home_profissional", tab: "Estoque" },
  { label: "Serviços", icon: Scissors, path: "/home_profissional", tab: "Servicos" },
  { label: "Fichas", icon: FileText, path: "/home_profissional", tab: "Fichas" },
  { label: "Como Utilizar", icon: HelpCircle, path: "/home_profissional", tab: "ComoUtilizar" },
  { label: "Minha Conta", icon: User, path: "/account" },
];

const mobileNavItems = [
  { label: "Início", icon: Home, path: "/home_profissional", tab: undefined },
  { label: "Clientes", icon: Users, path: "/home_profissional", tab: "Clientes" },
  { label: "Financeiro", icon: DollarSign, path: "/home_profissional", tab: "Financeiro" },
  { label: "Conta", icon: User, path: "/account" },
];

export default function AppSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const currentTab = searchParams.get("tab");
  const { signOut, profile } = useAuth();
  const [isDark, setIsDark] = useState(!document.documentElement.classList.contains("light"));

  const isAdmin = profile?.role === "admin";

  const allNavItems = isAdmin ? [...navItems, { label: "Admin", icon: Shield, path: "/admin", tab: undefined }] : navItems;

  const toggleTheme = () => {
    document.documentElement.classList.toggle("light");
    setIsDark(!isDark);
  };

  const isActive = (item: typeof navItems[0]) => {
    if (item.path === "/home_profissional" && location.pathname === "/home_profissional") {
      if (!item.tab && !currentTab) return true;
      if (item.tab && currentTab === item.tab) return true;
    }
    if (item.path !== "/home_profissional" && location.pathname === item.path) return true;
    return false;
  };

  const getLink = (item: typeof navItems[0]) =>
    item.tab ? `${item.path}?tab=${item.tab}` : item.path;

  const initials = profile?.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase() || "FB";

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className={cn("flex items-center gap-3 px-4 pt-5 pb-3", collapsed && "justify-center px-2")}>
        <div className="w-9 h-9 rounded-xl gradient-brand flex items-center justify-center flex-shrink-0">
          <DollarSign className="w-4 h-4 text-primary-foreground" />
        </div>
        {!collapsed && (
          <div>
            <h1 className="text-base font-bold text-foreground tracking-tight">FinBeauty</h1>
            <p className="text-[9px] text-muted-foreground tracking-widest uppercase">v6.0.0</p>
          </div>
        )}
      </div>

      <div className={cn("mx-3 mb-3 p-2.5 rounded-xl bg-secondary/50", collapsed && "mx-1 p-2")}>
        <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
          <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center flex-shrink-0 text-xs font-bold text-primary-foreground">
            {initials}
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-sm font-semibold text-foreground truncate">{profile?.full_name || "Profissional"}</p>
              <p className="text-[10px] text-muted-foreground truncate">Profissional</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto scrollbar-thin">
        {allNavItems.map((item) => (
          <NavLink
            key={item.label}
            to={getLink(item)}
            onClick={() => setMobileOpen(false)}
            className={cn(
              "flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
              collapsed && "justify-center px-2",
              isActive(item)
                ? "gradient-brand text-primary-foreground shadow-lg glow-brand"
                : "text-sidebar-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
            {!collapsed && <span className="text-sm">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="p-2 space-y-0.5">
        <button onClick={toggleTheme} className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors",
          collapsed && "justify-center px-2"
        )}>
          {isDark ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
          {!collapsed && <span>{isDark ? "Tema Claro" : "Tema Escuro"}</span>}
        </button>
        <button onClick={() => signOut()} className={cn(
          "flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors",
          collapsed && "justify-center px-2"
        )}>
          <LogOut className="w-[18px] h-[18px]" />
          {!collapsed && <span>Sair</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex items-center justify-center p-2 mx-3 mb-3 rounded-lg text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(true)}
        className="lg:hidden fixed top-3 left-3 z-50 p-2 rounded-lg bg-card border border-border text-foreground"
      >
        <Menu className="w-5 h-5" />
      </button>

      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <div className="relative w-60 bg-sidebar border-r border-sidebar-border h-full">
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
            {sidebarContent}
          </div>
        </div>
      )}

      <aside className={cn(
        "hidden lg:flex flex-col h-screen sticky top-0 bg-sidebar border-r border-sidebar-border transition-all duration-300",
        collapsed ? "w-[68px]" : "w-60"
      )}>
        {sidebarContent}
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border flex justify-around py-1.5 px-1">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.label}
            to={getLink(item)}
            className={cn(
              "flex flex-col items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] font-medium transition-colors",
              isActive(item) ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </NavLink>
        ))}
      </nav>
    </>
  );
}
